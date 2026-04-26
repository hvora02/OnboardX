// ManagerAnalytics.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ManagerAnalytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/analytics/manager", {
      headers: { "X-Role": "manager" },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setData)
      .catch((err) => console.warn("ManagerAnalytics fetch failed:", err));
  }, []);

  return (
    <div className="p-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-2">Team Engagement Levels</h3>
        <p className="text-sm text-slate-500 mb-6">
          Total queries per top struggle area per employee.
        </p>
        {data.length === 0 ? (
          <p className="text-slate-400 text-center py-12">No team data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" />
              <YAxis dataKey="employee" type="category" width={100} />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white p-3 rounded-lg text-xs shadow-xl">
                        <p className="font-bold">{payload[0].payload.employee}</p>
                        <p className="mt-1">Struggle: "{payload[0].payload.question}"</p>
                        <p className="text-indigo-400">Frequency: {payload[0].value} queries</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}