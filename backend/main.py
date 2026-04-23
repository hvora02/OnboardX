from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import requests
 
app = FastAPI()
 
# ------------------ CORS ------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ------------------ LOAD DATA ------------------
with open("../data/tools.json", "r", encoding="utf-8") as f:
    tools = json.load(f)
 
# ------------------ MEMORY ------------------
sessions = {}  # session_id → history
 
# ------------------ OLLAMA CONFIG ------------------
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi"  # fast and already on your machine
 
 
@app.get("/")
def home():
    return {"message": "OnboardX Backend Running 🚀"}
 
 
# ------------------ INTENT DETECTION ------------------
def detect_intent(q):
    problem_words = [
        "forgot", "miss", "issue", "error", "not working", "unable",
        "reject", "problem", "cant", "can't", "denied", "failed",
        "conflict", "wrong", "fix", "broken", "not showing", "not visible"
    ]
    return "problem" if any(word in q for word in problem_words) else "action"
 
 
# ------------------ SCORING ------------------
def calculate_score(query, keywords):
    score = 0
    for kw in keywords:
        if kw in query:
            score += 15
        else:
            for word in kw.split():
                if len(word) > 3 and word in query:
                    score += 3
    return score
 
 
# ------------------ EDGE CASE DETECTOR ------------------
def is_out_of_scope(q):
    out_of_scope_signals = [
        "weather", "cricket", "ipl", "movie", "song", "joke",
        "who is", "what is the capital", "stock price", "news",
        "recipe", "food", "restaurant", "politics", "python tutorial",
        "how to code", "explain ai", "what is machine learning",
        "tell me about yourself", "who made you", "are you chatgpt"
    ]
    return any(signal in q for signal in out_of_scope_signals)
 
 
# ------------------ AI REWRITE (Ollama - Local) ------------------
def ai_rewrite(user_q, tool_name, entry, history_text):
    try:
        # Short and strict prompt — works well with phi
        prompt = f"""You are OnboardX, a friendly onboarding assistant for new employees.
 
RULES:
- Answer in 2-3 natural friendly sentences like a helpful colleague.
- Do NOT use bullet points or numbered lists.
- Only use the data provided below. Never add outside information.
- If history is provided, use it to understand follow-up questions.
- Be warm and simple — the user is new to the company.
 
Company data:
Steps: {entry.get('steps', [])}
Rules: {entry.get('rules', [])}
FAQs: {entry.get('faq', [])}
Mistakes to avoid: {entry.get('mistakes', [])}
 
Previous conversation:
{history_text if history_text else "None"}
 
Employee asked: {user_q}
 
Reply in 2-3 friendly sentences only. No bullet points:"""
 
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.6,
                    "num_predict": 150  # short = fast
                }
            },
            timeout=60
        )
 
        result = response.json()
        answer = result["response"].strip()
 
        # Safety check — if phi returns something too short or empty, use fallback
        if len(answer) < 20:
            return build_fallback(tool_name, entry)
 
        return answer
 
    except requests.exceptions.ConnectionError:
        print("❌ Ollama is not running! Start it with: ollama serve")
        return "⚠️ Local AI is not running. Please start Ollama and try again."
 
    except Exception as e:
        print(f"Ollama error: {e}")
        return build_fallback(tool_name, entry)
 
 
# ------------------ FALLBACK (if Ollama fails) ------------------
def build_fallback(tool_name, entry):
    topic = entry["topic"]
    intent = entry.get("intent", "action")
 
    if intent == "problem":
        response = f"Here's how to fix '{topic}' in {tool_name}:\n\n"
    else:
        response = f"Here's how to '{topic}' in {tool_name}:\n\n"
 
    for step in entry.get("steps", []):
        response += f"• {step}\n"
 
    if entry.get("rules"):
        response += "\n📌 Keep in mind:\n"
        for rule in entry["rules"][:2]:
            response += f"- {rule}\n"
 
    return response
 
 
# ------------------ MAIN API ------------------
@app.post("/ask")
def ask(data: dict):
    q = data.get("question", "").strip()
    session_id = data.get("session_id", "default")
 
    if not q:
        return {"answer": "Please ask something! 😊"}
 
    q_lower = q.lower()
 
    # 🧠 Session memory
    history = sessions.get(session_id, [])
    history_text = ""
    for h in history[-4:]:
        history_text += f"User: {h['q']}\nAssistant: {h['a']}\n"
 
    # ------------------ SMALL TALK ------------------
    greetings = ["hi", "hello", "hey", "hii", "helo", "sup", "good morning", "good afternoon"]
    if any(q_lower == g or q_lower.startswith(g) for g in greetings):
        return {"answer": "Hey! 👋 I'm OnboardX, your onboarding buddy. I can help you with Zoho People and GitHub Desktop. What do you need help with?"}
 
    if any(word in q_lower for word in ["thank", "thanks", "tysm", "ty", "thank you"]):
        return {"answer": "Happy to help! 😊 Feel free to ask anytime."}
 
    if any(word in q_lower for word in ["bye", "goodbye", "see you", "cya", "ok bye"]):
        return {"answer": "Goodbye! 👋 Good luck with your onboarding. Come back anytime!"}
 
    # ------------------ IDENTITY QUESTIONS ------------------
    if any(phrase in q_lower for phrase in ["who are you", "what are you", "are you ai", "are you chatgpt", "who made you", "what can you do"]):
        return {
            "answer": "I'm OnboardX 👋 — a local AI assistant built for new employees at this company. I can help you with Zoho People (leaves, attendance, timesheets) and GitHub Desktop (repos, branches, PRs). I run fully on your company's machine — no data ever leaves! What do you need help with?"
        }
 
    # ------------------ OUT OF SCOPE ------------------
    if is_out_of_scope(q_lower):
        return {
            "answer": "That's a bit outside what I know! 😅 I'm only trained on company tools and processes. I can help with things like applying for leave, fixing missed attendance, or cloning a repo. What can I help you with?"
        }
 
    # ------------------ TOO VAGUE ------------------
    if len(q_lower.split()) < 2:
        return {
            "answer": "Could you give me a bit more context? Try something like — 'How do I apply for leave?' or 'I forgot to check in today' or 'How do I create a branch in GitHub?'"
        }
 
    # ------------------ WHAT CAN YOU DO ------------------
    if any(phrase in q_lower for phrase in ["what can you help", "what do you know", "help me with", "what topics"]):
        return {
            "answer": "I can help you with:\n\n🗓️ Zoho People — applying leave, half day, attendance, timesheets, payslips\n\n💻 GitHub Desktop — cloning repos, creating branches, pull requests, merge conflicts\n\nJust ask me anything related to these!"
        }
 
    # ------------------ INTENT DETECTION ------------------
    intent = detect_intent(q_lower)
 
    best_match = None
    best_score = 0
    best_tool = None
 
    # ------------------ MATCHING ------------------
    for tool in tools:
        for entry in tool["entries"]:
            score = calculate_score(q_lower, entry["keywords"])
 
            if intent == "problem" and entry.get("intent") == "problem":
                score += 10
 
            if score > best_score:
                best_score = score
                best_match = entry
                best_tool = tool["tool"]
 
    # ------------------ MATCHED — send to Ollama ------------------
    if best_match and best_score >= 5:
        answer = ai_rewrite(q, best_tool, best_match, history_text)
 
        history.append({"q": q, "a": answer})
        sessions[session_id] = history[-6:]
 
        return {"answer": answer}
 
    # ------------------ WEAK MATCH ------------------
    if history and best_score > 0:
        return {
            "answer": "Hmm, I'm not quite sure what you mean. 🤔 Are you following up on what we were discussing, or is this something new? Try rephrasing — like 'How do I apply for leave?' or 'I forgot to check in'."
        }
 
    # ------------------ NO MATCH ------------------
    return {
        "answer": "I don't have info on that in our company knowledge base. 🙁 I can help with leave, attendance, timesheets (Zoho People) or repos, branches, PRs (GitHub Desktop). Try asking something like 'How do I apply for sick leave?' or 'How do I create a pull request?'"
    }