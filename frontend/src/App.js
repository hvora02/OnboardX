import { useState, useEffect, useRef } from "react";

const SUGGESTIONS = [
  { icon: "🗓️", text: "How do I apply for leave?" },
  { icon: "⏰", text: "I forgot to check in today" },
  { icon: "📋", text: "How to fill my timesheet?" },
  { icon: "💻", text: "How do I clone a repository?" },
  { icon: "🔀", text: "How to create a pull request?" },
  { icon: "❌", text: "My leave got rejected" },
];

function TypingIndicator() {
  return (
    <div style={s.typingRow}>
      <Avatar label="OX" />
      <div style={{ ...s.bubble, ...s.botBubble }}>
        <div style={s.dots}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{ ...s.dot, animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Avatar({ label, isUser }) {
  return (
    <div
      style={{
        ...s.avatar,
        background: isUser
          ? "linear-gradient(135deg, #f59e0b, #ef4444)"
          : "linear-gradient(135deg, #6366f1, #06b6d4)",
        marginRight: isUser ? 0 : 10,
        marginLeft: isUser ? 10 : 0,
        fontSize: isUser ? 9 : 10,
      }}
    >
      {label}
    </div>
  );
}

function ChatMessage({ msg, isNew }) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        margin: "8px 0",
        animation: isNew ? "fadeUp 0.25s ease forwards" : "none",
      }}
    >
      {!isUser && <Avatar label="OX" />}
      <div
        style={{
          ...s.bubble,
          ...(isUser ? s.userBubble : s.botBubble),
        }}
      >
        {msg.text}
      </div>
      {isUser && <Avatar label="You" isUser />}
    </div>
  );
}

export default function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(
    "user-" + Math.random().toString(36).substring(7),
  );
  const [newMsgIndex, setNewMsgIndex] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askQuestion = async (inputText) => {
    const finalQ = (inputText || question).trim();
    if (!finalQ || loading) return;

    const nextIndex = messages.length;
    setMessages((prev) => [...prev, { role: "user", text: finalQ }]);
    setNewMsgIndex(nextIndex);
    setLoading(true);
    setQuestion("");

    try {
      const res = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: finalQ, session_id: sessionId }),
      });
      const data = await res.json();
      setMessages((prev) => {
        setNewMsgIndex(prev.length);
        return [...prev, { role: "bot", text: data.answer }];
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "⚠️ Couldn't reach the server. Make sure the backend is running.",
        },
      ]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const isEmpty = messages.length === 0;

  return (
    <div style={s.page}>
      <style>{css}</style>

      {/* Sidebar */}
      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <span style={{ fontSize: 26 }}>🤝</span>
          <span style={s.sidebarTitle}>OnboardX</span>
        </div>
        <div style={s.sidebarSection}>QUICK HELP</div>
        {SUGGESTIONS.map((sg, i) => (
          <button
            key={i}
            className="sidebar-btn"
            style={s.sidebarBtn}
            onClick={() => askQuestion(sg.text)}
          >
            <span style={{ marginRight: 8 }}>{sg.icon}</span>
            {sg.text}
          </button>
        ))}
        <div style={s.sidebarFooter}>
          <div style={s.sidebarBadge}>🔒 Company data only</div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={s.headerTitle}>Hey there 👋 I'm OnboardX</div>
            <div style={s.headerSub}>
              Ask me anything about Zoho People or GitHub Desktop
            </div>
          </div>
          <div style={s.onlineBadge}>
            <span style={s.onlineDot} />
            Online
          </div>
        </div>

        {/* Chat area */}
        <div style={s.chatArea}>
          {isEmpty ? (
            <div style={s.emptyState}>
              <div style={s.emptyIcon}>💬</div>
              <div style={s.emptyTitle}>Start a conversation</div>
              <div style={s.emptySub}>
                Pick a suggestion from the left panel, or type your own question
                below. I only answer company-related questions — no random
                stuff!
              </div>
              <div style={s.chipRow}>
                {SUGGESTIONS.slice(0, 3).map((sg, i) => (
                  <button
                    key={i}
                    className="chip"
                    style={s.chip}
                    onClick={() => askQuestion(sg.text)}
                  >
                    {sg.icon} {sg.text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage key={i} msg={msg} isNew={i === newMsgIndex} />
            ))
          )}
          {loading && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div style={s.inputArea}>
          <div style={s.inputWrapper}>
            <input
              ref={inputRef}
              style={s.input}
              placeholder="Type your question... (e.g. How do I apply for leave?)"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            />
            <button
              className="send-btn"
              style={{ ...s.sendBtn, opacity: question.trim() ? 1 : 0.45 }}
              onClick={askQuestion}
              disabled={!question.trim() || loading}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <div style={s.inputHint}>
            Only answers questions about company tools · Responses based on
            internal data
          </div>
        </div>
      </div>
    </div>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap%27);
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sora', sans-serif; background: #0f0f13; color: #e8e8f0; }
 
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes blink {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
 
  .sidebar-btn:hover {
    background: rgba(99,102,241,0.15) !important;
    color: #a5b4fc !important;
    transform: translateX(3px);
  }
  .chip:hover {
    background: rgba(99,102,241,0.2) !important;
    border-color: #6366f1 !important;
    color: #c7d2fe !important;
  }
  .send-btn:hover:not(:disabled) {
    background: #4f46e5 !important;
    transform: scale(1.05);
  }
  input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #2d2d3d; border-radius: 4px; }
`;

const s = {
  page: {
    display: "flex",
    height: "100vh",
    overflow: "hidden",
    background: "#0f0f13",
  },

  // --- Sidebar ---
  sidebar: {
    width: 260,
    background: "#17171f",
    borderRight: "1px solid #1e1e2e",
    display: "flex",
    flexDirection: "column",
    padding: "20px 12px",
    flexShrink: 0,
    overflow: "hidden",
  },
  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "4px 8px 20px",
    borderBottom: "1px solid #1e1e2e",
    marginBottom: 16,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#e8e8f0",
    letterSpacing: "-0.3px",
  },
  sidebarSection: {
    fontSize: 10,
    fontWeight: 600,
    color: "#4b4b6a",
    letterSpacing: "1.5px",
    padding: "0 8px",
    marginBottom: 8,
  },
  sidebarBtn: {
    width: "100%",
    textAlign: "left",
    padding: "9px 12px",
    borderRadius: 8,
    border: "none",
    background: "transparent",
    color: "#9494b0",
    fontSize: 12.5,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "'Sora', sans-serif",
    marginBottom: 2,
    display: "flex",
    alignItems: "center",
  },
  sidebarFooter: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sidebarBadge: {
    fontSize: 11,
    color: "#4b4b6a",
    padding: "6px 10px",
    background: "#1e1e2e",
    borderRadius: 6,
  },

  // --- Main ---
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "#0f0f13",
  },
  header: {
    padding: "18px 28px",
    borderBottom: "1px solid #1e1e2e",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#13131a",
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: "#e8e8f0",
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 12,
    color: "#5a5a7a",
  },
  onlineBadge: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    color: "#34d399",
    background: "rgba(52,211,153,0.1)",
    padding: "5px 12px",
    borderRadius: 20,
    border: "1px solid rgba(52,211,153,0.2)",
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#34d399",
    display: "inline-block",
  },

  // --- Chat ---
  chatArea: {
    flex: 1,
    overflowY: "auto",
    padding: "24px 28px",
  },

  // --- Empty state ---
  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    textAlign: "center",
    padding: "40px 20px",
    animation: "fadeUp 0.4s ease forwards",
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#e8e8f0",
    marginBottom: 10,
  },
  emptySub: {
    fontSize: 14,
    color: "#5a5a7a",
    maxWidth: 440,
    lineHeight: 1.7,
    marginBottom: 28,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "center",
  },
  chip: {
    padding: "9px 16px",
    borderRadius: 20,
    border: "1px solid #2d2d3d",
    background: "transparent",
    color: "#7878a0",
    fontSize: 13,
    cursor: "pointer",
    transition: "all 0.15s ease",
    fontFamily: "'Sora', sans-serif",
  },

  // --- Messages ---
  avatar: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    color: "white",
    fontSize: 10,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    letterSpacing: "0.3px",
  },
  bubble: {
    padding: "11px 16px",
    borderRadius: 16,
    maxWidth: "70%",
    fontSize: 14,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  userBubble: {
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    color: "white",
    borderBottomRightRadius: 4,
  },
  botBubble: {
    background: "#1e1e2e",
    color: "#d4d4e8",
    border: "1px solid #2d2d3d",
    borderBottomLeftRadius: 4,
  },
  typingRow: {
    display: "flex",
    alignItems: "flex-end",
    margin: "8px 0",
  },
  dots: {
    display: "flex",
    gap: 5,
    alignItems: "center",
    padding: "6px 4px",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: "#6366f1",
    display: "inline-block",
    animation: "blink 1.2s infinite ease-in-out",
  },

  // --- Input ---
  inputArea: {
    padding: "16px 28px 20px",
    borderTop: "1px solid #1e1e2e",
    background: "#13131a",
    flexShrink: 0,
  },
  inputWrapper: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: "13px 18px",
    borderRadius: 12,
    border: "1.5px solid #2d2d3d",
    background: "#1e1e2e",
    color: "#e8e8f0",
    fontSize: 14,
    transition: "all 0.2s",
    fontFamily: "'Sora', sans-serif",
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    flexShrink: 0,
  },
  inputHint: {
    fontSize: 11,
    color: "#3a3a5a",
    textAlign: "center",
    marginTop: 10,
  },
};
