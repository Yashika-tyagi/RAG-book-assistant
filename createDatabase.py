#load
#split into chunks
#create embeddings
#store  into chroma

from dotenv import load_dotenv
load_dotenv()
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
data=PyPDFLoader("document_loaders/GRU.pdf")  #deeplearning.pdf
docs=data.load()
splitter=RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=10
)
chunks=splitter.split_documents(docs)
embedding_model=HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vector_store=Chroma.from_documents(
    documents=chunks,  #bcz size of docs is too big thats why documents-=chunks
    embedding=embedding_model,
    persist_directory="chroma-db"
)