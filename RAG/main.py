from dotenv import load_dotenv

from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate

from providers import (
    get_llm,
    get_embeddings,
    build_chroma_collection_name,
    llm_text,
    strip_code_fences,
    get_api_key,
)

load_dotenv()

# Make sure the key is configured.
get_api_key()

embedding_model = get_embeddings()

COLLECTION_NAME = build_chroma_collection_name()

vector_store = Chroma(
    persist_directory="chroma-db",
    collection_name=COLLECTION_NAME,
    embedding_function=embedding_model,
)

retriever = vector_store.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 4,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    },
)

llm = get_llm()

prompt = ChatPromptTemplate([
    ('system', """You are a helpful AI assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."

Respond in plain text. Never return JSON or code fences.
"""),
    ('human', """Context:
{context}

Question:
{question}
""")
])


print("RAG System Is Created.")
print("Press 0 to EXIT")

while True:
    query = input("You : ")
    if query == '0':
        break

    try:
        docs = retriever.invoke(query)
    except Exception as error:
        print("Retrieval error:", error)
        docs = []

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )

    final_prompt = prompt.invoke(
        {
            'context': context,
            'question': query,
        }
    )

    response = llm.invoke(final_prompt)

    print(f"\n AI Response : {strip_code_fences(llm_text(response))}")