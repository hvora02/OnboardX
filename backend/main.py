from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json
import requests
import sqlite3
from datetime import datetime

# Creates DB connection
conn = sqlite3.connect("chat.db", check_same_thread=False)
cursor = conn.cursor()

# Creates table (runs once)

# Sessions table
cursor.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_id INTEGER,
    question TEXT,
    answer TEXT,
    tool TEXT,
    created_at TIMESTAMP
)
""")

# Users table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT
)
""")

cursor.execute("SELECT COUNT(*) FROM users")
if cursor.fetchone()[0] == 0:
    cursor.executemany("""
    INSERT INTO users (name, role) VALUES (?, ?)
    """, [
        ("Admin", "admin"),
        ("Manager A", "manager"),
        ("Manager B", "manager"),
        ("Intern A", "employee"),
        ("Intern B", "employee"),
        ("Intern C", "employee"),
        ("Intern D", "employee"),
        ("Intern E", "employee")
    ])

conn.commit()
 
app = FastAPI()
 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
with open("../data/tools.json", "r", encoding="utf-8") as f:
    tools = json.load(f)
 
sessions = {}
 
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "phi"
 
@app.get("/")
def home():
    return {"message": "OnboardX Backend Running 🚀"}
 
 
def detect_intent(q):
    problem_words = [
        "forgot", "miss", "issue", "error", "not working", "unable",
        "reject", "problem", "cant", "can't", "denied", "failed",
        "conflict", "wrong", "fix"
    ]
    return "problem" if any(word in q for word in problem_words) else "action"
 
 
def calculate_score(query, keywords):
    score = 0
    for kw in keywords:
        if kw == query:
            score += 40
        elif kw in query:
            score += 20
        else:
            for word in kw.split():
                if len(word) > 3 and word in query:
                    score += 5
    return score
 
 
def clean_ai_output(text):
    text = text.strip()
 
    if text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
 
    bad_phrases = [
        "let's imagine", "for example", "suppose",
        "consider", "scenario", "john", "mary", "employees"
    ]
 
    for phrase in bad_phrases:
        if phrase in text.lower():
            return None
 
    return text
 
 
def get_next_steps(entry, history):
    if not history:
        return entry.get("steps", [])[:3]
 
    last_answer = history[-1]["a"].lower()
 
    for i, step in enumerate(entry.get("steps", [])):
        if step.lower() in last_answer:
            return entry.get("steps", [])[i+1:i+3]
 
    return entry.get("steps", [])[:3]
 
 
def extract_relevant_data(entry, user_q, history):
    q = user_q.lower()
 
    steps = entry.get("steps", [])
    rules = entry.get("rules", [])
 
    if "after" in q or "next" in q:
        return get_next_steps(entry, history), rules[:2]
 
    filtered_steps = []
    for step in steps:
        if any(word in step.lower() for word in q.split()):
            filtered_steps.append(step)
 
    if filtered_steps:
        return filtered_steps[:3], rules[:2]
 
    return steps[:3], rules[:2]
 
 
def ai_rewrite(user_q, tool_name, entry, history):
    try:
        steps, rules = extract_relevant_data(entry, user_q, history)
 
        prompt = f"""
You are OnboardX, an internal company assistant.
 
STRICT RULES:
- Answer ONLY the question
- Use ONLY the data provided
- Keep answer SHORT (2 sentences max)
- DO NOT add examples or stories
- DO NOT explain extra
- DO NOT wrap answer in quotes
 
Steps: {steps}
Rules: {rules}
 
User: {user_q}
Answer:
"""
 
        response = requests.post(
            OLLAMA_URL,
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.5,
                    "num_predict": 120
                }
            },
            timeout=30
        )
 
        result = response.json()
        raw = result["response"]
 
        answer = clean_ai_output(raw)
 
        if not answer or len(answer) < 15:
            return build_fallback(tool_name, entry)
 
        return answer
 
    except:
        return build_fallback(tool_name, entry)
 
 
def build_fallback(tool_name, entry):
    response = f"Here’s how to {entry['topic'].lower()} in {tool_name}:\n\n"
 
    for step in entry.get("steps", [])[:4]:
        response += f"• {step}\n"
 
    if entry.get("rules"):
        response += "\n📌 Keep in mind:\n"
        for rule in entry["rules"][:2]:
            response += f"- {rule}\n"
 
    return response
 
 
def is_out_of_scope(q):
    signals = [
        "weather", "cricket", "movie", "joke",
        "who is", "python tutorial", "news"
    ]
    return any(s in q for s in signals)
 
 
@app.post("/ask")
def ask(data: dict):
    user_id = data.get("user_id", 4)

    q = data.get("question", "").strip()
    session_id = data.get("session_id", "default")
 
    if not q:
        return {"answer": "Please ask something! 😊"}
 
    q_lower = q.lower()
    cursor.execute("""
    SELECT question, answer
    FROM sessions
    WHERE session_id = ?
    ORDER BY created_at DESC
    LIMIT 6
    """, (session_id,))

    rows = cursor.fetchall()

    history = [
        {"q": r[0], "a": r[1]}
        for r in reversed(rows)
    ]
 
    if q_lower in ["hi", "hello", "hey"]:
        return {"answer": "Hey! 👋 I'm OnboardX. How can I help you?"}
 
    if "thank" in q_lower:
        return {"answer": "Happy to help! 😊"}
 
    if "bye" in q_lower:
        return {"answer": "Goodbye! 👋"}
 
    if is_out_of_scope(q_lower):
        return {"answer": "I can only help with company tools like Zoho People and GitHub Desktop."}
 
    if len(q_lower.split()) < 2:
        return {"answer": "Could you be a bit more specific?"}
 
    intent = detect_intent(q_lower)
 
    best_match = None
    best_score = 0
    best_tool = None
 
    for tool in tools:
        for entry in tool["entries"]:
            score = calculate_score(q_lower, entry["keywords"])
 
            if intent == "problem" and entry.get("intent") == "problem":
                score += 10
 
            if score > best_score:
                best_score = score
                best_match = entry
                best_tool = tool["tool"]
 
    if best_match and best_score >= 5:
        answer = ai_rewrite(q, best_tool, best_match, history)
 
        # 💾 Save to DB
        cursor.execute("""
        INSERT INTO sessions (session_id, user_id, question, answer, tool, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (session_id, user_id, q, answer, best_tool, datetime.now()))

        conn.commit()

        # Optional: keep memory cache (fine for speed)
        history.append({"q": q, "a": answer})
        sessions[session_id] = history[-6:]
 
        return {"answer": answer}
 
    if history:
        return {"answer": "Do you mean something related to your previous question?"}
 
    return {"answer": "I couldn’t find that in company data. Try asking about leave, attendance, or GitHub tasks."}

# admin insights
# for analytics - fetches logs for top-questions
@app.get("/analytics/top-questions")
def top_questions():
    cursor.execute("""
        SELECT question, COUNT(*) as count
        FROM sessions
        GROUP BY question
        ORDER BY count DESC
        LIMIT 5
    """)

    rows = cursor.fetchall()

    return [
        {"question": row[0], "count": row[1]}
        for row in rows
    ]

# admin insights
# for analytics - fetches logs for top-tools
@app.get("/analytics/top-tools")
def top_tools():
    cursor.execute("""
        SELECT tool, COUNT(*) as count
        FROM sessions
        GROUP BY tool
        ORDER BY count DESC
    """)

    rows = cursor.fetchall()

    return [
        {"tool": row[0], "count": row[1]}
        for row in rows
    ]

# admin insights
# for analytics - fetches logs for intent-breakdown
@app.get("/analytics/intent-breakdown")
def intent_breakdown():
    cursor.execute("SELECT question FROM sessions")
    rows = cursor.fetchall()

    problem = 0
    action = 0

    for (q,) in rows:
        if detect_intent(q.lower()) == "problem":
            problem += 1
        else:
            action += 1

    return {
        "problem_queries": problem,
        "action_queries": action
    }

# user based analytics
@app.get("/analytics/user/{user_id}")
def user_analytics(user_id: int):
    cursor.execute("""
        SELECT question, COUNT(*) as count
        FROM sessions
        WHERE user_id = ?
        GROUP BY question
        ORDER BY count DESC
        LIMIT 5
    """, (user_id,))

    rows = cursor.fetchall()

    return [
        {"question": r[0], "count": r[1]}
        for r in rows
    ]

# manager insights
@app.get("/analytics/manager")
def manager_view():
    cursor.execute("""
        SELECT u.name, s.question, COUNT(*) as count
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE u.role = 'employee'
        GROUP BY u.name, s.question
        ORDER BY count DESC
        LIMIT 10
    """)

    rows = cursor.fetchall()

    return [
        {"employee": r[0], "question": r[1], "count": r[2]}
        for r in rows
    ]