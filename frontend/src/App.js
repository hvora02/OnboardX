import { useState, useEffect, useRef } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    setQuestion("");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/ask?q=${encodeURIComponent(question)}`
      );
      const data = await res.json();

      const botMessage = { role: "bot", text: data.answer };
      setMessages((prev) => [...prev, botMessage]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Error connecting to backend" }
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OnboardX – Your Onboarding Assistant 🚀</h1>

      {/* Suggestions */}
      <div style={styles.suggestions}>
        {["Apply Leave", "Forgot Check-in", "Timesheet"].map((item) => (
          <button
            key={item}
            onClick={() => setQuestion(item.toLowerCase())}
            style={styles.suggestionButton}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Chat Box */}
      <div style={styles.chatBox}>
        {messages.length === 0 && (
          <p style={{ color: "#666" }}>
            Ask anything about onboarding, like leave, timesheet, or attendance.
          </p>
        )}

        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              margin: "10px"
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px 15px",
                borderRadius: "12px",
                maxWidth: "70%",
                background:
                  msg.role === "user" ? "#2563eb" : "#f1f1f1",
                color: msg.role === "user" ? "white" : "black",
                whiteSpace: "pre-wrap"
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ textAlign: "left", margin: "10px" }}>
            <div style={styles.botBubble}>⏳ Thinking...</div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder="Ask something..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && askQuestion()}
        />

        <button style={styles.button} onClick={askQuestion}>
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    fontFamily: "Arial"
  },
  title: {
    marginTop: "20px"
  },
  suggestions: {
    marginBottom: "10px",
    display: "flex",
    justifyContent: "center",
    gap: "10px"
  },
  suggestionButton: {
    padding: "8px 14px",
    borderRadius: "20px",
    border: "1px solid #ddd",
    backgroundColor: "#fff",
    cursor: "pointer",
    fontSize: "14px"
  },
  chatBox: {
    height: "60vh",
    overflowY: "auto",
    border: "1px solid #ccc",
    margin: "20px auto",
    width: "60%",
    padding: "10px",
    borderRadius: "10px",
    backgroundColor: "#fafafa"
  },
  inputArea: {
    display: "flex",
    justifyContent: "center",
    gap: "10px"
  },
  input: {
    padding: "10px",
    width: "300px",
    borderRadius: "5px",
    border: "1px solid #ccc"
  },
  button: {
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    cursor: "pointer"
  },
  botBubble: {
    display: "inline-block",
    padding: "10px 15px",
    borderRadius: "12px",
    background: "#f1f1f1"
  }
};

export default App;