import os
from dotenv import load_dotenv

from openai import OpenAI

load_dotenv()

client = OpenAI(
    api_key=os.getenv("GROQ_API_KEY")
    or os.getenv("XAI_API_KEY")
    or os.getenv("GROK_API_KEY")
    or os.getenv("GEMINI_API_KEY"),
    base_url=os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
)

for model in client.models.list():
    print(model.id, model.context_window)