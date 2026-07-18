from dotenv import load_dotenv
load_dotenv()
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_mistralai import ChatMistralAI
from langchain_core.prompts import ChatPromptTemplate

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = Chroma(
    persist_directory="chroma-db",
    embedding_function=embeddings
)
retriever=vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k":4,
        "fetch_k":10,
        "lambda_mult":0.5 #lambda mult=1 =similar
    }
)
llm=ChatMistralAI(model="mistral-small-2506")
prompt=ChatPromptTemplate.from_messages([("system","""You are a helpful AI assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."
"""),("human","Context:{context} and Question:{question}")])
model=ChatMistralAI(model="mistral-small-2506")

print("Rag system created")

while(True):
    query=input("You: ")
    if query=="0":
        break
    docs=retriever.invoke(query)

    context="".join(
        [doc.page_content for doc in docs]
    )

    final_prompt=prompt.invoke({
    "context":context,
    "question":query
    })
    
    response=llm.invoke(final_prompt)
    print(response.content)