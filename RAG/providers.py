# Load environment variables
from dotenv import load_dotenv

load_dotenv()

import os

# -----------------------------
# Groq configuration
# (OpenAI-compatible endpoint)
# -----------------------------

GROQ_API_BASE = (
    os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    .strip()
    .rstrip("/")
)


def get_api_key():
    key = (
        os.getenv("GROQ_API_KEY")
        or os.getenv("XAI_API_KEY")
        or os.getenv("GROK_API_KEY")
        or os.getenv("GEMINI_API_KEY")
    )
    if not key:
        raise RuntimeError(
            "GROQ_API_KEY is not configured in RAG/.env"
        )
    return str(key).strip()


def get_llm(**kwargs):
    """Return a Groq LLM client (OpenAI-compatible ChatOpenAI)."""
    from langchain_openai import ChatOpenAI

    model = kwargs.pop("model", None) or os.getenv(
        "GROQ_MODEL", "openai/gpt-oss-120b"
    )
    temperature = kwargs.pop("temperature", 0.3)
    timeout = kwargs.pop("timeout", 180)

    return ChatOpenAI(
        model=model,
        api_key=get_api_key(),
        base_url=GROQ_API_BASE,
        temperature=temperature,
        max_retries=3,
        request_timeout=timeout,
        **kwargs,
    )


def get_embeddings():
    """Return an embedding model.

    "local" (default) uses sentence-transformers so no external embedding
    API is required. Groq does not expose an embeddings endpoint, so this
    is the recommended (and only reliable) option.
    """
    provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()

    if provider == "openai":
        from langchain_openai import OpenAIEmbeddings

        return OpenAIEmbeddings(
            model=os.getenv("EMBEDDING_MODEL", "text-embedding-3-small"),
            api_key=get_api_key(),
            base_url=os.getenv("EMBEDDINGS_BASE_URL", "https://api.openai.com/v1"),
        )

    try:
        from langchain_huggingface import HuggingFaceEmbeddings
    except ImportError:
        from langchain_community.embeddings import HuggingFaceEmbeddings

    return HuggingFaceEmbeddings(
        model_name=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
        encode_kwargs={"normalize_embeddings": True},
    )


# -----------------------------
# Helpers to turn LLM responses
# into plain text.
# -----------------------------

def llm_text(response):
    """Extract a plain string from a LangChain LLM response."""
    content = getattr(response, "content", response)

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                parts.append(
                    item.get("text")
                    or item.get("content")
                    or ""
                )
            elif isinstance(item, str):
                parts.append(item)
            else:
                parts.append(str(item))
        return "".join(parts)

    return str(content)


def strip_code_fences(text):
    """Remove markdown ```...``` fences that models sometimes add."""
    import re

    if not isinstance(text, str):
        text = str(text)

    text = re.sub(r"^```(?:json|text|markdown|html)?\s*", "", text.strip())
    text = re.sub(r"\s*```$", "", text.strip())
    return text.strip()


def build_chroma_collection_name():
    """Namespace the Chroma collection per embedding provider/model."""
    provider = os.getenv("EMBEDDING_PROVIDER", "local").strip().lower()
    model = os.getenv(
        "EMBEDDING_MODEL", "all-MiniLM-L6-v2"
    ).strip().replace("/", "_").replace("-", "_")
    base = os.getenv("CHROMA_COLLECTION", "learnflow_docs").strip()
    return f"{base}_{provider}_{model}"