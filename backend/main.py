from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load data
with open("../data/tools.json", "r", encoding="utf-8") as f:
    tools = json.load(f)


@app.get("/")
def home():
    return {"message": "OnboardX Backend Running 🚀"}


# 🧠 Detect intent
def detect_intent(q):
    if any(word in q for word in ["forgot", "miss", "issue", "error", "not working"]):
        return "problem"
    return "action"


# 💬 Build human-like response
def build_response(tool, entry, intent):
    topic = entry["topic"]
    response = ""

    if intent == "problem":
        response += f"No worries — here’s how you can fix it in {tool}:\n\n"
    else:
        response += f"Here’s how you can {topic.lower()} in {tool}:\n\n"

    # Steps
    for step in entry.get("steps", []):
        response += f"• {step}\n"

    # Rules
    if "rules" in entry:
        response += "\n📌 Keep in mind:\n"
        for rule in entry["rules"][:2]:
            response += f"- {rule}\n"

    # Mistakes
    if intent == "action" and "mistakes" in entry:
        response += "\n⚠️ Common mistakes:\n"
        for mistake in entry["mistakes"][:2]:
            response += f"- {mistake}\n"

    # Problem cases
    if intent == "problem" and "when_to_use" in entry:
        response += "\nThis usually applies when:\n"
        for item in entry["when_to_use"][:3]:
            response += f"- {item}\n"

    # Fallback
    if "fallback" in entry:
        response += f"\n\n📘 {entry['fallback']}"

    response += "\n\nIf you need help with anything else, just ask 🙂"

    return response


@app.get("/ask")
def ask(q: str):
    q_lower = q.lower()

    # ❗ Handle vague queries
    if len(q_lower.split()) < 2:
        return {
            "answer": "Could you be a bit more specific?\n\nTry asking:\n• Apply leave\n• Fill timesheet\n• Forgot check-in"
        }

    intent = detect_intent(q_lower)

    best_match = None
    best_score = 0
    best_tool = None

    # 🔍 Smart matching
    for tool in tools:
        for entry in tool["entries"]:
            for keyword in entry["keywords"]:
                words = keyword.split()
                score = sum(1 for word in words if word in q_lower)

                if score > best_score:
                    best_score = score
                    best_match = entry
                    best_tool = tool["tool"]

    # ✅ Only return if strong match
    if best_match and best_score >= 2:
        return {"answer": build_response(best_tool, best_match, intent)}

    # ❌ fallback
    return {
        "answer": "I’m not sure what you’re looking for.\n\nYou can try:\n• Apply leave\n• Timesheet\n• Forgot check-in"
    }