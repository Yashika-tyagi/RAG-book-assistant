from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "document_loaders"
CHROMA_DIR = "chroma-db"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# --- Shared state ---
current_doc_name = None
uploaded_pdf_path = None   # path of uploaded-but-not-yet-indexed PDF
rag_ready = False
retriever = None

# --- Load embeddings & LLM once ---
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
llm = ChatMistralAI(model="mistral-small-2506")
prompt = ChatPromptTemplate.from_messages([
    ("system", """You are a helpful AI assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."
"""),
    ("human", "Context:{context} and Question:{question}")
])


def load_vectorstore():
    """Load existing chroma-db if it exists."""
    global retriever, rag_ready
    if os.path.exists(CHROMA_DIR) and os.listdir(CHROMA_DIR):
        vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            embedding_function=embeddings
        )
        retriever = vectorstore.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.5}
        )
        rag_ready = True
        print("Loaded existing vectorstore.")
    else:
        rag_ready = False
        print("No vectorstore found.")


def index_pdf(pdf_path):
    """Run createDatabase logic on the given PDF (same as createDatabase.py)."""
    global retriever, rag_ready, current_doc_name

    loader = PyPDFLoader(pdf_path)
    docs = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=100, chunk_overlap=10)
    chunks = splitter.split_documents(docs)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR
    )

    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 10, "lambda_mult": 0.5}
    )
    rag_ready = True
    current_doc_name = os.path.basename(pdf_path)
    print(f"Indexed: {current_doc_name}")


# Load on startup
load_vectorstore()
print("RAG system ready.")


# ------------------------------------------------------------------
# ROUTES
# ------------------------------------------------------------------

@app.route("/api/status", methods=["GET"])
def status():
    return jsonify({
        "status": "ready" if rag_ready else "no_document",
        "document": current_doc_name,
        "uploaded_pdf": os.path.basename(uploaded_pdf_path) if uploaded_pdf_path else None,
        "message": "RAG system is running." if rag_ready else "No document indexed."
    })


@app.route("/api/upload", methods=["POST"])
def upload():
    """Step 1 — Save the PDF to disk. Does NOT index it yet."""
    global uploaded_pdf_path

    if "file" not in request.files:
        return jsonify({"error": "No file provided."}), 400

    file = request.files["file"]
    if not file.filename.endswith(".pdf"):
        return jsonify({"error": "Only PDF files are supported."}), 400

    save_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(save_path)
    uploaded_pdf_path = save_path

    return jsonify({
        "success": True,
        "filename": file.filename,
        "message": f"'{file.filename}' uploaded successfully. Click 'Create Vector Database' to index it."
    })


@app.route("/api/create-db", methods=["POST"])
def create_db():
    """Step 2 — Index the uploaded PDF into ChromaDB."""
    global uploaded_pdf_path

    # Allow passing a custom path in body, or use last-uploaded
    data = request.get_json(silent=True) or {}
    pdf_path = data.get("pdf_path") or uploaded_pdf_path

    if not pdf_path or not os.path.exists(pdf_path):
        return jsonify({"error": "No uploaded PDF found. Please upload a PDF first."}), 400

    try:
        index_pdf(pdf_path)
        return jsonify({
            "success": True,
            "document": current_doc_name,
            "chunks_info": "Document chunked (size=100, overlap=10) and stored in ChromaDB.",
            "message": f"Vector database created for '{current_doc_name}'."
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/chat", methods=["POST"])
def chat():
    if not rag_ready:
        return jsonify({"error": "No document indexed. Please upload a PDF and create the vector database first."}), 400

    data = request.get_json()
    query = data.get("query", "").strip()
    if not query:
        return jsonify({"error": "Query cannot be empty."}), 400

    docs = retriever.invoke(query)
    context = "".join([doc.page_content for doc in docs])
    sources = [doc.page_content[:200] for doc in docs]

    final_prompt = prompt.invoke({"context": context, "question": query})
    response = llm.invoke(final_prompt)

    return jsonify({
        "answer": response.content,
        "sources": sources
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
