import { useState } from "react";

function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = async () => {
    if (!question) return;

    setLoading(true);
    setAnswer("");

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/ask?q=${question}`
      );
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      setAnswer("Error connecting to backend");
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>OnboardX 🚀</h1>

      <input
        style={styles.input}
        placeholder="Ask something like 'How to deploy code?'"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <button style={styles.button} onClick={askQuestion}>
        Ask
      </button>

      {loading && <p>Loading...</p>}

      {answer && (
        <div style={styles.answerBox}>
          <h3>Answer:</h3>
          <pre>{answer}</pre>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "80px",
    fontFamily: "Arial"
  },
  title: {
    fontSize: "32px"
  },
  input: {
    padding: "10px",
    width: "300px",
    marginRight: "10px"
  },
  button: {
    padding: "10px 15px",
    cursor: "pointer"
  },
  answerBox: {
    marginTop: "30px",
    padding: "20px",
    border: "1px solid #ccc",
    width: "60%",
    marginLeft: "auto",
    marginRight: "auto",
    textAlign: "left"
  }
};

export default App;