from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()

embedding_model = GoogleGenerativeAIEmbeddings(
        model="gemini-embedding-2"
)

vector_store = Chroma(
    persist_directory='chroma-db',
    embedding_function=embedding_model
    )

retriever = vector_store.as_retriever(

    search_type = "mmr",
    search_kwargs = {
        "k" : 4, #Top 4 relevant
        "fetch_k":10, # from Top 10 retrive top 4
        "lambda_mult" :0.5
    }
)

llm = ChatGoogleGenerativeAI(model="models/gemini-flash-latest")

prompt = ChatPromptTemplate([
    ('system', """You are a helpful AI assistant.

Use ONLY the provided context to answer the question.

If the answer is not present in the context,
say: "I could not find the answer in the document."
"""),
('human',"""Context:
{context}

Question:
{question}
"""
        )
])


print("RAG System Is Created.")
print("Press 0 to EXIT")

while True:
    query = input("You : ")
    if query == '0':
        break
    docs = retriever.invoke(query)

    context = "\n\n".join(
        [doc.page_content for doc in docs]
    )

    final_prompt = prompt.invoke(
        {
            'context':context,
            'question':query
        }
    )

    response = llm.invoke(final_prompt)
    print(f"\n AI Response : {response.content}")