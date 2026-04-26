// AdminAnalytics.jsx
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e"];

export default function AdminAnalytics() {
  const [questions, setQuestions] = useState([]);
  const [tools, setTools] = useState([]);
  const [intent, setIntent] = useState([]);

  // AdminAnalytics.jsx

  useEffect(() => {
    const headers = { "X-Role": "admin" };

    // Update fetcher to catch the error
    const fetcher = (url, setter) =>
      fetch(url, { headers })
        .then((res) => {
          if (!res.ok) return null; // Silently ignore if restricted
          return res.json();
        })
        .then((data) => {
          if (data) setter(data);
        })
        .catch((err) => {
          // This is where the "Failed to fetch" gets stopped
          console.warn("Background fetch attempt ignored:", url);
        });

    fetcher("http://127.0.0.1:8000/analytics/top-questions", setQuestions);
    fetcher("http://127.0.0.1:8000/analytics/top-tools", setTools);
    fetcher("http://127.0.0.1:8000/analytics/intent-breakdown", setIntent);
  }, []);

  return (
    <div className="p-8 space-y-12">
      {/* 1. Global Trending Questions */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold mb-4">Top Global Questions</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={questions}>
            <XAxis dataKey="question" hide />
            <YAxis />
            <Tooltip labelFormatter={(val) => `Question: ${val}`} />
            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Tool Usage */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4">Tool Popularity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={tools}>
              <XAxis dataKey="tool" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Intent Breakdown */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold mb-4">Query Intent</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={intent}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {intent.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
