#load pdf 
#split into chunks 
#create the embeddings 
#store into chroma 
from langchain_community.document_loaders import PyPDFLoader,TextLoader,WebBaseLoader
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings 
from langchain_community.vectorstores import Chroma 
from dotenv import load_dotenv

load_dotenv()

# data = PyPDFLoader("document loaders/GRU.pdf")
# loader = PyPDFLoader("document loaders/GRU.pdf")
# data = PyPDFLoader("D:\\Gen AI\\RAG\\document loaders\\GRU.pdf")
data = "D:\\Gen AI\\RAG\\document loaders\\GRU.pdf"
# data = TextLoader("document loaders/notes.txt")

def load_document(source):

    if source.startswith("http"):
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
    chunk_overlap = 200
)

chunk = splitter.split_documents(docs)

embedding = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
)

vector_store = Chroma.from_documents(
    documents=docs,
    embedding=embedding,
    persist_directory='chroma-db'
)