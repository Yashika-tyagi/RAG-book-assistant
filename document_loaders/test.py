from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter
data=TextLoader("notes.txt")
splitter=CharacterTextSplitter(
    separator="",
    chunk_size=10,
    chunk_overlap=1
)
docs=data.load()
chunks=splitter.split_documents(docs)
 #docs[0] shows page content alongw ith metadata
for i in chunks:
    print(i.page_content)
    print()
    print()
    
