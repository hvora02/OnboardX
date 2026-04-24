import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

export default function AdminAnalytics() {
  const [topQuestions, setTopQuestions] = useState([]);
  const [topTools, setTopTools] = useState([]);
  const [intent, setIntent] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/analytics/top-questions")
      .then(res => res.json())
      .then(setTopQuestions);

    fetch("http://127.0.0.1:8000/analytics/top-tools")
      .then(res => res.json())
      .then(setTopTools);

    fetch("http://127.0.0.1:8000/analytics/intent-breakdown")
      .then(res => res.json())
      .then(setIntent);
  }, []);

  const COLORS = ["#6366f1", "#22c55e"];

  return (
    <div className="p-10 space-y-10">

      <h1 className="text-3xl font-bold">📊 Admin Analytics</h1>

      {/* TOP QUESTIONS */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">Top Questions</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topQuestions}>
            <XAxis dataKey="question" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TOP TOOLS */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="font-semibold mb-4">Most Used Tools</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topTools}>
            <XAxis dataKey="tool" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* INTENT BREAKDOWN */}
      {intent && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="font-semibold mb-4">Intent Breakdown</h2>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Problem", value: intent.problem_queries },
                  { name: "Action", value: intent.action_queries }
                ]}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                <Cell fill={COLORS[0]} />
                <Cell fill={COLORS[1]} />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}