import streamlit as st
from dotenv import load_dotenv
import tempfile
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate

from providers import (
    get_llm,
    get_embeddings,
    build_chroma_collection_name,
    llm_text,
    strip_code_fences,
    get_api_key,
)


# -----------------------------
# Load Environment Variables
# -----------------------------

load_dotenv()

# Make sure the key is configured.
get_api_key()


# -----------------------------
# Page Configuration
# -----------------------------

st.set_page_config(
    page_title="RAG Book Assistant",
    page_icon="📚",
    layout="wide",
)


st.title("📚 RAG Book Assistant")
st.write("Upload a PDF and ask questions from your document")


# -----------------------------
# Upload PDF
# -----------------------------

uploaded_file = st.file_uploader(
    "Upload your PDF book",
    type=["pdf"],
)


# -----------------------------
# Create Vector Database
# -----------------------------

if uploaded_file:

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf",
    ) as tmp:
        tmp.write(uploaded_file.read())
        pdf_path = tmp.name

    st.success("PDF uploaded successfully!")

    if st.button("🔍 Create Vector Database"):

        with st.spinner("Processing PDF and creating embeddings..."):

            # Load PDF
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()

            # Split Documents
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
            )
            chunks = splitter.split_documents(documents)

            # Create Embeddings
            embeddings = get_embeddings()

            # Create Vector Store
            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                collection_name=build_chroma_collection_name(),
                persist_directory="chroma-db",
            )

        st.success("✅ Vector Database Created Successfully!")


# -----------------------------
# Load Existing Vector Database
# -----------------------------

embeddings = get_embeddings()

vectorstore = Chroma(
    persist_directory="chroma-db",
    collection_name=build_chroma_collection_name(),
    embedding_function=embeddings,
)

retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={
        "k": 4,
        "fetch_k": 10,
        "lambda_mult": 0.5,
    },
)

# -----------------------------
# Grok Model
# -----------------------------

llm = get_llm()


# -----------------------------
# Prompt
# -----------------------------

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a helpful AI assistant.

Answer ONLY using the provided document context.

If the answer is not available in the document,
say:

"I could not find the answer in the document."

Give a clear and well formatted answer in plain text.
Never return JSON or code fences.
""",
        ),
        (
            "human",
            """
Context:

{context}


Question:

{question}

""",
        ),
    ]
)


# -----------------------------
# Question Section
# -----------------------------

st.divider()

st.subheader("💬 Ask Questions From Your PDF")

question = st.text_input("Enter your question")


if st.button("🚀 Ask Question"):

    if question.strip() == "":

        st.warning("Please enter a question.")

    else:

        with st.spinner(
            "Searching document and generating answer..."
        ):

            # Retrieve documents
            try:
                docs = retriever.invoke(question)
            except Exception as error:
                print("Retrieval error:", error)
                docs = []

            context = "\n\n".join(
                [doc.page_content for doc in docs]
            )

            # Create Prompt
            final_prompt = prompt.invoke(
                {
                    "context": context,
                    "question": question,
                }
            )

            # Grok Response
            response = llm.invoke(final_prompt)

            answer = strip_code_fences(llm_text(response))

        # -----------------------------
        # Display Answer
        # -----------------------------

        st.subheader("🤖 AI Answer")

        st.markdown(answer)