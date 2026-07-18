
from dotenv import load_dotenv
load_dotenv()
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
docs=[
    Document(page_content="Python is widely used in AI",metadata={"source":"AI_book"}),
    Document(page_content="Pandas used for data analysis in python.",metadata={"source":"DataScience"}),
    Document(page_content="Neural network is core of Deep Learning",metadata={"source":"DL book"})
]
embedding_model=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store=Chroma.from_documents(
    documents=docs,
    embedding=embedding_model,
    persist_directory="chroma-db"
)
result=vector_store.similarity_search("What is used for data analysis ?",k=2)
#vector store is sued for data retrieval and storage not for answering the questions llm is responsible for qstnans
for r in result:
    print(r.page_content)
    print(r.metadata)