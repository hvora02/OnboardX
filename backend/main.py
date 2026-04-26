import json
import struct
import requests
import sqlite3
import sqlite_vec
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

# ─────────────────────────────────────────────────────────────────────────────
# Embeddings
# ─────────────────────────────────────────────────────────────────────────────
EMBEDDING_DIM = 384
embedder      = SentenceTransformer("all-MiniLM-L6-v2")

def embed(text: str) -> list[float]:
    return embedder.encode(text, normalize_embeddings=True).tolist()

def serialize_vec(v: list[float]) -> bytes:
    return struct.pack(f"{len(v)}f", *v)

# Threshold tuned for short query vs short hook (not query vs bloated metadata)
# cosine_sim >= 0.30 is intentionally loose — let Mistral handle relevance,
# not the distance gate. We just want to avoid totally unrelated entries.
DIST_THRESHOLD = 1.0   # effectively "take the best match always" — see note below


# ─────────────────────────────────────────────────────────────────────────────
# DB
# ─────────────────────────────────────────────────────────────────────────────
conn = sqlite3.connect("chat.db", check_same_thread=False)
conn.row_factory = sqlite3.Row
conn.enable_load_extension(True)
sqlite_vec.load(conn)
conn.enable_load_extension(False)

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS sessions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    user_id    INTEGER,
    question   TEXT,
    answer     TEXT,
    tool       TEXT,
    created_at TIMESTAMP
)""")

cursor.execute(f"""
CREATE VIRTUAL TABLE IF NOT EXISTS session_vecs
USING vec0(embedding FLOAT[{EMBEDDING_DIM}])
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS tool_kb (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_name TEXT,
    topic     TEXT,
    intent    TEXT,
    full_json TEXT
)""")

cursor.execute(f"""
CREATE VIRTUAL TABLE IF NOT EXISTS tool_kb_vecs
USING vec0(embedding FLOAT[{EMBEDDING_DIM}])
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    role TEXT
)""")

cursor.execute("SELECT COUNT(*) FROM users")
if cursor.fetchone()[0] == 0:
    cursor.executemany("INSERT INTO users (name, role) VALUES (?, ?)", [
        ("Admin",     "admin"),
        ("Manager A", "manager"),
        ("Manager B", "manager"),
        ("Intern A",  "employee"),
        ("Intern B",  "employee"),
        ("Intern C",  "employee"),
        ("Intern D",  "employee"),
        ("Intern E",  "employee"),
    ])

conn.commit()


# ─────────────────────────────────────────────────────────────────────────────
# Tool KB — seeded once at startup
#
# KEY FIX: embed each keyword as its own row instead of one bloated hook.
# This way "how to fill timesheet" directly hits the "fill timesheet" keyword
# vector because they're in the same semantic neighbourhood.
# Multiple rows per entry is fine — they all point to the same full_json.
# ─────────────────────────────────────────────────────────────────────────────
with open("../data/tools.json", "r", encoding="utf-8") as f:
    tools_data = json.load(f)

def ingest_tools():
    cursor.execute("SELECT COUNT(*) FROM tool_kb")
    if cursor.fetchone()[0] > 0:
        return

    for tool in tools_data:
        for entry in tool["entries"]:
            entry_json = json.dumps(entry)
            intent     = entry.get("intent", "action")

            # Embed the topic itself as one row
            topic_hook = f"{entry['topic']} {tool['tool']}"
            _insert_kb_row(tool["tool"], entry["topic"], intent, entry_json, topic_hook)

            # Embed each keyword phrase as its own row
            # Short, clean strings → vectors stay close to how users phrase queries
            for kw in entry.get("keywords", []):
                _insert_kb_row(tool["tool"], entry["topic"], intent, entry_json, kw)

            # Embed each FAQ question (stripped of "Q:") as its own row
            for faq in entry.get("faq", []):
                if faq.startswith("Q:"):
                    q_part = faq.split("A:")[0].replace("Q:", "").strip()
                    _insert_kb_row(tool["tool"], entry["topic"], intent, entry_json, q_part)

    conn.commit()
    count = cursor.execute("SELECT COUNT(*) FROM tool_kb").fetchone()[0]
    print(f"[OnboardX] Tool KB seeded — {count} rows ({len([e for t in tools_data for e in t['entries']])} entries).")

def _insert_kb_row(tool_name, topic, intent, full_json, hook_text):
    v = embed(hook_text)
    cursor.execute(
        "INSERT INTO tool_kb (tool_name, topic, intent, full_json) VALUES (?, ?, ?, ?)",
        (tool_name, topic, intent, full_json)
    )
    row_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO tool_kb_vecs (rowid, embedding) VALUES (?, ?)",
        (row_id, serialize_vec(v))
    )

ingest_tools()


def search_tools(q_vec: list[float], intent: str = None, k: int = 1) -> list[dict]:
    """
    Find the single best matching tool entry via KNN.
    We fetch k=10 rows (many may point to same entry due to per-keyword rows),
    deduplicate by topic, and return the closest match per unique entry.
    """
    rows = cursor.execute("""
        SELECT kb.tool_name, kb.topic, kb.intent, kb.full_json, v.distance
        FROM   tool_kb_vecs v
        JOIN   tool_kb kb ON kb.id = v.rowid
        WHERE  v.embedding MATCH ?
        AND    k = 20
        ORDER  BY v.distance
    """, (serialize_vec(q_vec),)).fetchall()

    # Deduplicate: keep best (lowest) distance per unique topic
    seen_topics: dict[str, dict] = {}
    for r in rows:
        key = r["topic"]
        if key not in seen_topics or r["distance"] < seen_topics[key]["distance"]:
            seen_topics[key] = {
                "tool":     r["tool_name"],
                "topic":    r["topic"],
                "intent":   r["intent"],
                "entry":    json.loads(r["full_json"]),
                "distance": r["distance"],
            }

    results = sorted(seen_topics.values(), key=lambda x: x["distance"])

    # Nudge problem-intent entries up if query signals a problem
    if intent == "problem":
        results.sort(key=lambda m: (
            m["distance"] - 0.15 if m["intent"] == "problem" else m["distance"]
        ))

    return results[:k]


# ─────────────────────────────────────────────────────────────────────────────
# Session helpers
# ─────────────────────────────────────────────────────────────────────────────
def insert_session(session_id, user_id, question, answer, tool, vec):
    cursor.execute("""
        INSERT INTO sessions (session_id, user_id, question, answer, tool, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (session_id, user_id, question, answer, tool, datetime.now()))
    row_id = cursor.lastrowid
    cursor.execute(
        "INSERT INTO session_vecs(rowid, embedding) VALUES (?, ?)",
        (row_id, serialize_vec(vec))
    )
    conn.commit()


def knn_sessions(vec: list[float], k: int = 1):
    try:
        rows = cursor.execute("""
            SELECT s.id, s.question, s.answer, s.tool, v.distance
            FROM   session_vecs v
            JOIN   sessions s ON s.id = v.rowid
            WHERE  v.embedding MATCH ?
            AND    k = ?
            ORDER  BY v.distance
        """, (serialize_vec(vec), k)).fetchall()
        return rows
    except Exception:
        return []   # empty table on first boot — sqlite-vec errors on 0 rows


# ─────────────────────────────────────────────────────────────────────────────
# Analytics clustering
# ─────────────────────────────────────────────────────────────────────────────
CLUSTER_DIST = 0.71   # cosine_sim >= 0.75 equivalent — used only for clustering

def cluster_sessions(user_id: int = None) -> list[dict]:
    where  = "WHERE user_id = ?" if user_id else ""
    params = (user_id,)           if user_id else ()

    all_sessions = cursor.execute(
        f"SELECT id, question FROM sessions {where} ORDER BY id", params
    ).fetchall()

    if not all_sessions:
        return []

    seen:     set[int]   = set()
    clusters: list[dict] = []

    for session in all_sessions:
        sid = session["id"]
        if sid in seen:
            continue

        q_vec = embed(session["question"])
        try:
            neighbours = cursor.execute("""
                SELECT s.id, s.question, v.distance
                FROM   session_vecs v
                JOIN   sessions s ON s.id = v.rowid
                WHERE  v.embedding MATCH ?
                AND    k = 50
                ORDER  BY v.distance
            """, (serialize_vec(q_vec),)).fetchall()
        except Exception:
            neighbours = []

        members = []
        for n in neighbours:
            if n["distance"] <= CLUSTER_DIST and n["id"] not in seen:
                if user_id:
                    owner = cursor.execute(
                        "SELECT user_id FROM sessions WHERE id = ?", (n["id"],)
                    ).fetchone()
                    if owner and owner["user_id"] != user_id:
                        continue
                members.append(n["question"])
                seen.add(n["id"])

        if members:
            clusters.append({
                "question": session["question"],
                "count":    len(members),
                "variants": members,
            })

    clusters.sort(key=lambda c: c["count"], reverse=True)
    return clusters


# ─────────────────────────────────────────────────────────────────────────────
# Intent + follow-up detection
# ─────────────────────────────────────────────────────────────────────────────
PROBLEM_WORDS = {
    "forgot", "miss", "missed", "issue", "error", "not working", "unable",
    "reject", "rejected", "problem", "cant", "can't", "denied", "failed",
    "conflict", "wrong", "fix", "broken", "not showing", "missing",
    "incorrect", "stuck"
}

def detect_intent(q: str) -> str:
    return "problem" if any(w in q for w in PROBLEM_WORDS) else "action"

VAGUE_FOLLOWUP_PHRASES = {
    "more", "tell me more", "explain more", "help more",
    "what next", "and then", "after that", "what should i do",
    "continue", "elaborate", "go on", "next step", "then what"
}

ALL_KB_KEYWORDS: set[str] = set()
for _tool in tools_data:
    for _entry in _tool["entries"]:
        for _kw in _entry.get("keywords", []):
            ALL_KB_KEYWORDS.update(_kw.lower().split())
        ALL_KB_KEYWORDS.update(_entry["topic"].lower().split())

def is_followup(q: str) -> bool:
    q_lower = q.lower().strip()
    if any(phrase in q_lower for phrase in VAGUE_FOLLOWUP_PHRASES):
        return True
    if len(q_lower.split()) <= 3:
        words = set(q_lower.split())
        return not bool(words & ALL_KB_KEYWORDS)
    return False


# ─────────────────────────────────────────────────────────────────────────────
# LLM
# ─────────────────────────────────────────────────────────────────────────────
OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

def ask_mistral(user_q: str, tool_name: str, entry: dict, history: list) -> str:
    history_text = ""
    if history:
        history_text = "Recent conversation:\n" + "\n".join(
            f"User: {h['q']}\nAssistant: {h['a']}" for h in history[-3:]
        ) + "\n\n"

    faq_text      = "\n".join(entry.get("faq", []))
    mistakes_text = ", ".join(entry.get("mistakes", []))

    prompt = f"""{history_text}You are OnboardX, a friendly internal company assistant helping new employees.

Answer in plain conversational prose — no bullet points, no numbered lists, no bold text.
Be concise (2-3 sentences). Only mention what directly answers the question.
For problems/errors, focus on the fix first.

Tool: {tool_name}
Process: {entry.get('topic')}
Steps: {entry.get('steps', [])}
Rules: {entry.get('rules', [])}
Common mistakes: {mistakes_text}
FAQs: {faq_text}

User: {user_q}
Assistant:"""

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={
                "model":   OLLAMA_MODEL,
                "prompt":  prompt,
                "stream":  False,
                "options": {"temperature": 0.7, "num_predict": 180},
            },
            timeout=45,
        )
        raw = resp.json()["response"].strip()
        if raw.startswith('"') and raw.endswith('"'):
            raw = raw[1:-1]

        # Flatten any bullets Mistral sneaks in into prose
        lines   = raw.splitlines()
        cleaned = []
        for line in lines:
            line = line.strip()
            if not line:
                continue
            line = line.lstrip("•-*0123456789. ")
            if line:
                cleaned.append(line)
        raw = " ".join(cleaned)

        if not raw or len(raw) < 15:
            print(f"[fallback] Mistral returned too short: '{raw}'")
            return build_fallback(tool_name, entry)

        # Ensure response ends with a full stop
        if raw and raw[-1] not in ".!?":
            raw += "."
        return raw
    except Exception as e:
        print(f"[fallback] Mistral error: {e}")
        return build_fallback(tool_name, entry)


def build_fallback(tool_name: str, entry: dict) -> str:
    """
    Fires only when Mistral times out or fails.
    Reads as a natural sentence: "Head to the Attendance section in Zoho People
    and tap Regularization, then enter the correct times and submit for approval."
    """
    print(f"[fallback] serving fallback for: {entry.get('topic')} / {tool_name}")
    steps = entry.get("steps", [])
    rules = entry.get("rules", [])

    if not steps:
        return f"You can handle this in {tool_name} under {entry.get('topic', 'the relevant section')}."

    # Build a flowing sentence from the first 3 steps
    s = [step.rstrip(".") for step in steps[:3]]
    if len(s) == 1:
        out = f"{s[0]} in {tool_name}."
    elif len(s) == 2:
        out = f"{s[0]} in {tool_name}, then {s[1].lower()}."
    else:
        out = f"{s[0]} in {tool_name}, then {s[1].lower()}, and {s[2].lower()}."

    if rules:
        rule = rules[0].rstrip(".")
        out += f" Keep in mind that {rule[0].lower()}{rule[1:]}."

    return out


# ─────────────────────────────────────────────────────────────────────────────
# Misc
# ─────────────────────────────────────────────────────────────────────────────
def is_out_of_scope(q: str) -> bool:
    return any(s in q for s in [
        "weather", "cricket", "movie", "joke", "who is", "python tutorial", "news"
    ])


# ─────────────────────────────────────────────────────────────────────────────
# App
# ─────────────────────────────────────────────────────────────────────────────
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

session_cache: dict = {}


@app.get("/")
def home():
    return {"message": "OnboardX Backend Running 🚀"}


# ── Debug endpoint — remove before prod ──────────────────────────────────────
@app.get("/debug/search")
def debug_search(q: str):
    q_vec = embed(q)
    rows  = cursor.execute("""
        SELECT kb.tool_name, kb.topic, kb.intent, v.distance
        FROM   tool_kb_vecs v
        JOIN   tool_kb kb ON kb.id = v.rowid
        WHERE  v.embedding MATCH ?
        AND    k = 5
        ORDER  BY v.distance
    """, (serialize_vec(q_vec),)).fetchall()
    return [
        {"tool": r["tool_name"], "topic": r["topic"], "distance": round(r["distance"], 4)}
        for r in rows
    ]


@app.post("/ask")
def ask(data: dict):
    user_id    = data.get("user_id", 4)
    q          = data.get("question", "").strip()
    session_id = data.get("session_id", "default")

    if not q:
        return {"answer": "Please ask something! 😊"}

    q_lower = q.lower()

    # ── history ───────────────────────────────────────────────────────────────
    rows = cursor.execute("""
        SELECT question, answer, tool
        FROM   sessions
        WHERE  session_id = ?
        ORDER  BY created_at DESC
        LIMIT  6
    """, (session_id,)).fetchall()
    history   = [{"q": r["question"], "a": r["answer"]} for r in reversed(rows)]
    last_tool = rows[0]["tool"] if rows else None

    last_entry = None
    if last_tool:
        for tool in tools_data:
            if tool["tool"] == last_tool and tool["entries"]:
                last_entry = tool["entries"][0]
                break

    # ── follow-up ─────────────────────────────────────────────────────────────
    if is_followup(q_lower) and last_entry:
        answer = ask_mistral(q, last_tool, last_entry, history)
        insert_session(session_id, user_id, q, answer, last_tool, embed(q))
        return {"answer": answer}

    # ── quick responses ───────────────────────────────────────────────────────
    if q_lower in ["hi", "hello", "hey"]:
        return {"answer": "Hey! 👋 I'm OnboardX. How can I help you today?"}
    if "thank" in q_lower:
        return {"answer": "Happy to help! 😊"}
    if "bye" in q_lower:
        return {"answer": "Goodbye! 👋"}
    if is_out_of_scope(q_lower):
        return {"answer": "I can only help with company tools like Zoho People and GitHub Desktop."}

    # ── embed ─────────────────────────────────────────────────────────────────
    q_vec  = embed(q)
    intent = detect_intent(q_lower)

    # Near-duplicate session cache (very tight — only exact rephrasing)
    past = knn_sessions(q_vec, k=1)
    if past and past[0]["distance"] < 0.20:
        return {"answer": past[0]["answer"]}

    # ── semantic search — always takes the best match ─────────────────────────
    # DIST_THRESHOLD removed from gate — with per-keyword rows the best match
    # is almost always correct; Mistral handles any residual irrelevance.
    # Only hard-reject if tool_kb is somehow empty.
    matches = search_tools(q_vec, intent=intent, k=1)

    if matches:
        best   = matches[0]
        answer = ask_mistral(q, best["tool"], best["entry"], history)
        insert_session(session_id, user_id, q, answer, best["tool"], q_vec)
        history.append({"q": q, "a": answer})
        session_cache[session_id] = history[-6:]
        return {"answer": answer}

    if history:
        return {"answer": "I'm not sure — could you rephrase? You can ask me about leave, attendance, timesheets, or GitHub."}
    return {"answer": "I couldn't find that. Try asking about leave, attendance, timesheets, or GitHub."}


# ─────────────────────────────────────────────────────────────────────────────
# Analytics
# ─────────────────────────────────────────────────────────────────────────────
@app.get("/analytics/top-questions")
def top_questions():
    return cluster_sessions()[:5]

@app.get("/analytics/top-tools")
def top_tools():
    rows = cursor.execute("""
        SELECT tool, COUNT(*) as count FROM sessions
        GROUP BY tool ORDER BY count DESC
    """).fetchall()
    return [{"tool": r["tool"], "count": r["count"]} for r in rows]

@app.get("/analytics/intent-breakdown")
def intent_breakdown():
    rows    = cursor.execute("SELECT question FROM sessions").fetchall()
    problem = sum(1 for r in rows if detect_intent(r["question"].lower()) == "problem")
    return {"problem_queries": problem, "action_queries": len(rows) - problem}

@app.get("/analytics/user/{user_id}")
def user_analytics(user_id: int):
    return cluster_sessions(user_id=user_id)[:5]

@app.get("/analytics/manager")
def manager_view():
    employees = cursor.execute("""
        SELECT DISTINCT u.id, u.name
        FROM   users u
        JOIN   sessions s ON s.user_id = u.id
        WHERE  u.role = 'employee'
    """).fetchall()

    result = []
    for emp in employees:
        for c in cluster_sessions(user_id=emp["id"])[:3]:
            result.append({
                "employee": emp["name"],
                "question": c["question"],
                "count":    c["count"],
                "variants": c["variants"],
            })

    result.sort(key=lambda x: x["count"], reverse=True)
    return result[:10]