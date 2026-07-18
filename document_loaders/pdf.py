from dotenv import load_dotenv
load_dotenv()
from langchain_community.document_loaders import PyPDFLoader
# from langchain_text_splitters import TokenTextSplitter
# splitter=TokenTextSplitter(
#     chunk_size=100,
#     chunk_overlap=10
# )
from langchain_text_splitters import RecursiveCharacterTextSplitter
splitter=RecursiveCharacterTextSplitter(
    chunk_size=100,
    chunk_overlap=10
)
data=PyPDFLoader("GRU.pdf")

docs=data.load()

chunks=splitter.split_documents(docs)
print(len(chunks))
print(chunks[0].page_content)