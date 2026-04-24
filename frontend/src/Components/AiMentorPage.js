import { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, ArrowRight, Zap, ShieldCheck, Loader2 } from "lucide-react";

export default function AiMentorPage({ activeRole }) {
  // makes session persist - despite refresh
  useEffect(() => {
    const session_id = localStorage.getItem("session_id");

    if (!session_id) {
      const newSession = crypto.randomUUID();
      localStorage.setItem("session_id", newSession);
    }
  }, []);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello! I am your OnboardX Copilot. I'm connected to the local backend and ready to help with ${activeRole} specific queries. \n\nYou can ask me about HR tools, technical setups, or company policies.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Auto-focus the input field on page load
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // 2. Auto-scroll to the latest message whenever messages or loading state changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textOverride) => {
    const messageToSend = textOverride || input;
    if (!messageToSend.trim() || isLoading) return;

    // Add user message to UI
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend }]);
    if (!textOverride) setInput("");
    setIsLoading(true);

    try {
      // 3. Talk to the FastAPI backend (Port 8000)

      function mapUserToId(name) {
        const map = {
          "admin": 1,
          "manager a": 2,
          "manager b": 3,
          "intern a": 4,
          "intern b": 5,
          "intern c": 6,
          "intern d": 7,
          "intern e": 8
        };

        return map[name.trim().toLowerCase()] || 4;
      }

      const session_id = localStorage.getItem("session_id");
      const user = JSON.parse(localStorage.getItem("user"));

      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: messageToSend,
          session_id: session_id,
          user_id: mapUserToId(user.name) // ✅ NOW USED
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success: Add AI answer
        setMessages((prev) => [...prev, { sender: "ai", text: data.answer }]);
      } else {
        // Server error
        setMessages((prev) => [...prev, { sender: "ai", text: "The mentor is resting. Error: " + (data.error || "Internal Server Error") }]);
      }
    } catch (err) {
      // Connection error
      setMessages((prev) => [
        ...prev, 
        { sender: "ai", text: "I can't reach the backend. Please ensure the FastAPI server is running on http://127.0.0.1:8000" }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggestions tailored to the role
  const suggestions = {
    Freshers: ["How do I apply leave?", "How to fill timesheet?", "Forgot check-in"],
    Intermediate: ["Explain Zing repo architecture", "How to run local tests?", "Security best practices"],
    Experienced: ["Auth flow deep dive", "Microservices communication", "Deployment pipeline"],
  };

  const currentSuggestions = suggestions[activeRole] || suggestions.Freshers;

  return (
    <div className="p-12 h-screen flex flex-col">
      {/* Page Header */}
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Mentor</h1>
          <p className="text-slate-500 mt-2 text-lg flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Active Session: <span className="text-indigo-600 font-semibold">{activeRole}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase rounded-full tracking-widest flex items-center gap-2">
            <Zap size={14} className="animate-pulse" /> Live Backend (8000)
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[300px,1fr] gap-8 min-h-0">
        
        {/* Sidebar: Quick Start Suggestions */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <MessageSquare size={20} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Quick Start</h2>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {currentSuggestions.map((text, index) => (
              <button 
                key={index} 
                disabled={isLoading}
                onClick={() => handleSend(text)}
                className="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 p-4 rounded-2xl transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-700">{text}</span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold text-center">Local & Secure</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100/40 border border-white flex flex-col relative overflow-hidden">
          
          {/* Internal Chat Scroll Area */}
          <div 
            ref={scrollRef} 
            className="flex-1 space-y-6 overflow-y-auto pr-4 mb-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          >
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-4 ${msg.sender === "user" ? "justify-end" : ""}`}>
                {msg.sender === "ai" && (
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-lg shadow-slate-200">
                    <Bot size={22} />
                  </div>
                )}
                
                <div className={`p-5 rounded-[1.5rem] max-w-[80%] text-sm leading-relaxed shadow-sm ${
                  msg.sender === "ai" 
                    ? "bg-white text-slate-700 border border-slate-100 rounded-tl-none whitespace-pre-line" 
                    : "bg-indigo-600 text-white rounded-tr-none"
                }`}>
                  {msg.text}
                </div>

                {msg.sender === "user" && (
                  <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 shadow-md border-2 border-white">
                    You
                  </div>
                )}
              </div>
            ))}
            
            {/* Thinking Indicator */}
            {isLoading && (
              <div className="flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
                  <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="p-5 rounded-[1.5rem] bg-white/50 text-slate-400 border border-slate-100 rounded-tl-none text-sm italic">
                  Analyzing knowledge base...
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="mt-auto pt-6 border-t border-slate-100/50">
            <div className="relative flex items-center bg-slate-50/50 rounded-2xl border border-slate-200 p-2 focus-within:ring-4 focus-within:ring-indigo-50 focus-within:border-indigo-200 transition-all">
              <input 
                ref={inputRef}
                type="text" 
                value={input}
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me how to setup VPN, fill timesheets, or apply leave..."
                className="flex-1 bg-transparent px-4 py-3 outline-none text-slate-800 text-sm font-medium disabled:cursor-not-allowed"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:bg-slate-200 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={22}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}