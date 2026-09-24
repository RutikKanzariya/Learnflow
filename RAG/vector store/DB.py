from langchain_chroma import Chroma
from dotenv import load_dotenv

load_dotenv()
from langchain_core.documents import Document

from providers import (
    get_embeddings,
    get_llm,
    build_chroma_collection_name,
)


docs = [
    Document(page_content="Python is widely used in Artificial Intelligence.", metadata={"source": "AI_book"}),
    Document(page_content="Pandas is used for data analysis in Python.", metadata={"source": "DataScience_book"}),
    Document(page_content="Neural networks are used in deep learning.", metadata={"source": "DL_book"}),
]


embedding_model = get_embeddings()

COLLECTION_NAME = build_chroma_collection_name()

vector_store = Chroma.from_documents(
    documents=docs,
    embedding=embedding_model,
    collection_name=COLLECTION_NAME,
    persist_directory="chroma-db",
)


result = vector_store.similarity_search("What is used for Data analysis?", k=2)
for r in result:
    print(r.page_content)
    print(r.metadata)

retriver = vector_store.as_retriever()

retrieved_docs = retriver.invoke("Explain Deep Learning")
for d in retrieved_docs:
    print(d.page_content)