#load pdf
#split into chunks
#create the embeddings
#store into chroma
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
)
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from dotenv import load_dotenv

from providers import get_embeddings, build_chroma_collection_name, get_api_key

load_dotenv()

get_api_key()

# data = PyPDFLoader("document loaders/GRU.pdf")
data = "D:\\Gen AI\\RAG\\document loaders\\GRU.pdf"
# data = TextLoader("document loaders/notes.txt")


def load_document(source):
    if source.startswith("http"):
        from langchain_community.document_loaders import WebBaseLoader

        loader = WebBaseLoader(source)
    else:
        extension = Path(source).suffix.lower()

        if extension == ".pdf":
            loader = PyPDFLoader(source)
        elif extension == ".txt":
            loader = TextLoader(source)
        else:
            raise Exception("Unsupported File")

    return loader.load()


docs = load_document(data)

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

chunks = splitter.split_documents(docs)

embedding = get_embeddings()

vector_store = Chroma.from_documents(
    documents=chunks,
    embedding=embedding,
    collection_name=build_chroma_collection_name(),
    persist_directory="chroma-db",
)