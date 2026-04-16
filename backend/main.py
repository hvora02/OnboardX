from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import requests

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load tools data
with open("../data/tools.json", "r", encoding="utf-8") as f:
    tools = json.load(f)


# Call local AI
def ask_llm(prompt):
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "phi",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": 80,
                    "temperature": 0.2
                }
            },
            timeout=30
        )
        return response.json()["response"]

    except Exception as e:
        return f"Error: {e}"


@app.get("/")
def home():
    return {"message": "OnboardX Backend Running"}


@app.get("/ask")
def ask(q: str):
    q_lower = q.lower()
    context = ""

    # Match user question with keywords
    for tool in tools:
        for keyword in tool["keywords"]:
            if keyword in q_lower:
                context = f"""
Tool Name: {tool['tool']}
Category: {tool['category']}
Description: {tool['description']}

When To Use:
{chr(10).join(tool['when_to_use'])}

Steps:
{chr(10).join(tool['steps'])}

Tips:
{chr(10).join(tool['tips'])}
"""
                break

    if context == "":
        context = "No exact company process found."

    prompt = f"""
You are a company onboarding assistant.

Answer ONLY from the provided context.
Do not use external knowledge.

Context:
{context}

Question:
{q}

Provide:
1. Tool name
2. Why it is used
3. Clear steps
"""

    answer = ask_llm(prompt)

    return {"answer": answer}