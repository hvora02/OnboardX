import { useNavigate } from "react-router-dom";

export default function Dashboard({ userName, activeRole }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    navigate("/"); // redirect to login
  }

  return (
    <div className="p-12 max-w-7xl mx-auto">
      {/* Top Header */}
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Welcome, {userName}!
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            You're on the <span className="text-indigo-600 font-bold">{activeRole}</span> onboarding path.
          </p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Today's Date</p>
          <p className="text-slate-800 font-semibold">April 17, 2026</p>
        </div>
      </header>

      {/* Large Hero Progress Card */}
      <div className="bg-white rounded-[2rem] p-10 shadow-xl shadow-slate-200/50 border border-white flex flex-col md:flex-row items-center justify-between mb-12 relative overflow-hidden">
        <div className="z-10">
          <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">Weekly Goal</span>
          <h2 className="text-5xl font-black text-slate-900 mt-4 mb-2">65% <span className="text-xl text-slate-400 font-medium">Complete</span></h2>
          <p className="text-slate-500 max-w-md">You've completed 12 tasks this week! Finish the "Auth Flow" module to hit your 80% target.</p>
          <button className="mt-8 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all">
            Continue Learning →
          </button>
        </div>
        
        <div className="relative w-48 h-48 mt-8 md:mt-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#4f46e5" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset="87.9" strokeLinecap="round" className="rotate-[-90deg] origin-center" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-slate-800">Day 3</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">of Week 1</span>
          </div>
        </div>
      </div>

      {/* Grid for Bottom Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-slate-800 mb-6">Active Learning Path</h3>
          <div className="space-y-4">
            <TaskRow title="Review Auth Flow Components" time="30m" tag="Frontend" status="Current" />
            <TaskRow title="Local Database Indexing" time="15m" tag="Security" status="Pending" />
            <TaskRow title="Team structure & SME's" time="10m" tag="Culture" status="Pending" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl mb-6">💬</div>
          <h3 className="text-2xl font-bold mb-2">AI Mentor</h3>
          <p className="text-indigo-100 text-sm leading-relaxed mb-8">Ask any technical or workflow question.</p>
          <div className="space-y-3">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left px-4 text-xs font-semibold">"How do I setup VPN?"</button>
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-left px-4 text-xs font-semibold">"Explain the Zing repo..."</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskRow({ title, time, tag, status }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${status === 'Current' ? 'bg-indigo-50' : 'bg-slate-50'}`}>
          {status === 'Current' ? '⚡' : '🔒'}
        </div>
        <div>
          <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h4>
          <p className="text-xs text-slate-400 font-medium">Est: {time} • {tag}</p>
        </div>
      </div>
      <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'Current' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {status}
      </div>
    </div>
  );
}