import streamlit as st
from dotenv import load_dotenv
import tempfile
import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI


# -----------------------------
# Load Environment Variables
# -----------------------------

load_dotenv()


# -----------------------------
# Page Configuration
# -----------------------------

st.set_page_config(
    page_title="RAG Book Assistant",
    page_icon="📚",
    layout="wide"
)


st.title("📚 RAG Book Assistant")
st.write("Upload a PDF and ask questions from your document")


# -----------------------------
# API KEY CONFIGURATION
# -----------------------------

if "GEMINI_API_KEY" in st.secrets:
    os.environ["GOOGLE_API_KEY"] = st.secrets["GEMINI_API_KEY"]


# -----------------------------
# Upload PDF
# -----------------------------

uploaded_file = st.file_uploader(
    "Upload your PDF book",
    type=["pdf"]
)


# -----------------------------
# Create Vector Database
# -----------------------------

if uploaded_file:

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".pdf"
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
                chunk_overlap=200
            )

            chunks = splitter.split_documents(documents)


            # Create Embeddings

            embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
            )


            # Create Vector Store

            vectorstore = Chroma.from_documents(
                documents=chunks,
                embedding=embeddings,
                persist_directory="chroma_db"
            )


            vectorstore.persist()


        st.success(
            "✅ Vector Database Created Successfully!"
        )



# -----------------------------
# Load Existing Vector Database
# -----------------------------

if os.path.exists("chroma_db"):


    embeddings = GoogleGenerativeAIEmbeddings(
    model="gemini-embedding-2"
    )


    vectorstore = Chroma(
        persist_directory="chroma_db",
        embedding_function=embeddings
    )


    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k":4,
            "fetch_k":10,
            "lambda_mult":0.5
        }
    )


    # -----------------------------
    # Gemini Model
    # -----------------------------

    llm = ChatGoogleGenerativeAI(
        model="gemini-flash-latest",
        temperature=0.2
    )


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

Give a clear and well formatted answer.
"""
            ),


            (
                "human",

                """
Context:

{context}


Question:

{question}

"""
            )

        ]
    )



    # -----------------------------
    # Question Section
    # -----------------------------

    st.divider()

    st.subheader(
        "💬 Ask Questions From Your PDF"
    )


    question = st.text_input(
        "Enter your question"
    )



    if st.button("🚀 Ask Question"):


        if question.strip()=="":

            st.warning(
                "Please enter a question."
            )


        else:


            with st.spinner(
                "Searching document and generating answer..."
            ):


                # Retrieve documents

                docs = retriever.invoke(
                    question
                )


                context = "\n\n".join(
                    [
                        doc.page_content
                        for doc in docs
                    ]
                )



                # Create Prompt

                final_prompt = prompt.invoke(
                    {
                        "context":context,
                        "question":question
                    }
                )


                # Gemini Response

                response = llm.invoke(
                    final_prompt
                )



                # -----------------------------
                # Clean Response Extraction
                # -----------------------------

                content = response.content


                if isinstance(content,list):

                    answer=""

                    for item in content:

                        if isinstance(item,dict):

                            if "text" in item:
                                answer += item["text"]


                        else:

                            answer += str(item)


                else:

                    answer = content



            # -----------------------------
            # Display Answer
            # -----------------------------

            st.subheader(
                "🤖 AI Answer"
            )


            st.markdown(
                answer
            )



else:

    st.info(
        "Please upload a PDF and create the Vector Database first."
    )