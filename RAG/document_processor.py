from pathlib import Path

from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    WebBaseLoader,
)

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma


embedding = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
)


def load_document(source):
    extension = Path(source).suffix.lower()

    if extension == ".pdf":
        loader = PyPDFLoader(source)

    elif extension == ".txt":
        loader = TextLoader(source)

    else:
        raise ValueError("Unsupported file type")

    return loader.load()


def process_pdf(file_path, document_id):
    # 1. Load PDF
    docs = load_document(file_path)

    # 2. Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
    )

    chunks = splitter.split_documents(docs)

    # 3. Add document metadata
    for chunk in chunks:
        chunk.metadata["documentId"] = document_id

    # 4. Create embeddings and store in Chroma
    vector_store = Chroma(
        collection_name=f"document_{document_id}",
        embedding_function=embedding,
        persist_directory="chroma-db",
    )

    vector_store.add_documents(chunks)

    return {
        "documentId": document_id,
        "chunks": len(chunks),
    }