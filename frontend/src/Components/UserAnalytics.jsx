// UserAnalytics.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function UserAnalytics() {
  const [myStats, setMyStats] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/analytics/user/${user.id}`, { headers: { "X-Role": "employee" } })
      .then(res => res.json())
      .then(setMyStats);
  }, [user.id]);

  return (
    <div className="p-8">
      <div className="bg-indigo-600 p-8 rounded-3xl text-white mb-8">
        <h2 className="text-2xl font-bold">Your Learning Insights</h2>
        <p className="text-indigo-100 opacity-80">A breakdown of the topics you've explored most with the AI Mentor.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={myStats}>
            <XAxis dataKey="question" hide />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Topic: ${label}`}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
            />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-1 gap-2">
          {myStats.map((item, i) => (
            <div key={i} className="flex justify-between text-sm p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <span className="text-slate-600 truncate mr-4">"{item.question}"</span>
              <span className="font-bold text-indigo-600">{item.count} searches</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}