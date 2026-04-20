// ComingSoonPage.js
import { Construction } from "lucide-react";

export default function ComingSoonPage({ title }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-12 text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-6 animate-pulse">
        <Construction size={40} />
      </div>
      <h1 className="text-3xl font-black text-slate-900 capitalize">
        {title} Module
      </h1>
      <p className="text-slate-500 mt-2 max-w-sm">
        We're currently building out this feature to provide a personalized experience. 
        Check back soon or ask the <span className="text-indigo-600 font-bold">AI Mentor</span> for help!
      </p>
      
      {/* Decorative dots to make it look "work in progress" */}
      <div className="flex gap-2 mt-8">
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
        <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce [animation-delay:0.4s]"></div>
      </div>
    </div>
  );
}