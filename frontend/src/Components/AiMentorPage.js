import { useState, useEffect, useRef } from "react";
import { MessageSquare, Bot, ArrowRight, Zap, ShieldCheck, Loader2 } from "lucide-react";

export default function AiMentorPage({ activeRole }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello! I am your OnboardX Copilot. I'm connected to the local backend and ready to help with ${activeRole} specific queries.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      // --- Integrated Friend's Backend Logic ---
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            message: userMessage,
            role: activeRole // Added role context for the backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
      } else {
        setMessages((prev) => [...prev, { sender: "ai", text: "Error: " + (data.error || "Backend issue") }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { sender: "ai", text: "Could not connect to local backend. Make sure the server is running on port 5000." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = {
    Freshers: ["How do I setup VPN?", "Explain git flow", "Where is the handbook?"],
    Intermediate: ["Explain Zing repo architecture", "How to run local tests?", "Security best practices"],
    Experienced: ["Auth flow deep dive", "Microservices communication", "Deployment pipeline"],
  };

  const currentSuggestions = suggestions[activeRole] || suggestions.Freshers;

  return (
    <div className="p-12 h-screen flex flex-col">
      <header className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">AI Mentor</h1>
          <p className="text-slate-500 mt-2 text-lg flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-500" />
            Connected to local backend: <span className="text-indigo-600 font-semibold">{activeRole} Mode</span>
          </p>
        </div>
        <span className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold uppercase rounded-full tracking-widest flex items-center gap-2">
            <Zap size={14}/> Live Backend
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px,1fr] gap-8 min-h-0">
        {/* Left Column: Suggestions */}
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-white flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <MessageSquare size={20}/>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Quick Start</h2>
          </div>
          <div className="space-y-3 flex-1">
            {currentSuggestions.map((text, index) => (
              <button 
                key={index} 
                disabled={isLoading}
                onClick={() => setInput(text)}
                className="w-full text-left bg-slate-50 hover:bg-indigo-50 border border-slate-100 p-4 rounded-xl transition-all flex items-center justify-between group disabled:opacity-50"
              >
                <span className="text-sm font-semibold text-slate-700">{text}</span>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Chat Window */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 shadow-xl shadow-indigo-100/30 border border-white flex flex-col relative overflow-hidden">
          <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto pr-2 mb-6">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : ""}`}>
                {msg.sender === "ai" && (
                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0">
                        <Bot size={20} />
                    </div>
                )}
                <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${
                    msg.sender === "ai" ? "bg-white text-slate-700 border border-slate-100 shadow-sm" : "bg-indigo-600 text-white"
                }`}>
                  {msg.text}
                </div>
                {msg.sender === "user" && (
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0 text-xs">
                        GD
                    </div>
                )}
              </div>
            ))}
            
            {/* Integrated Loading State */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white">
                  <Loader2 size={20} className="animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white text-slate-400 border border-slate-100 text-sm italic">
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="mt-auto border-t border-slate-100 pt-6">
            <div className="relative flex items-center bg-slate-50 rounded-full border border-slate-200 px-3 py-2">
              <input 
                type="text" 
                value={input}
                disabled={isLoading}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-800 text-sm disabled:cursor-not-allowed"
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-indigo-600 text-white disabled:bg-slate-300 transition-all"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={20}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}