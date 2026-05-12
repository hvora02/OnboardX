// AdminAnalytics.jsx
import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PURPLE = "#7F77DD";
const TEAL   = "#1D9E75";
const CORAL  = "#D85A30";
const COLORS = [PURPLE, TEAL, CORAL, "#BA7517", "#378ADD"];

const BASE = "http://127.0.0.1:8000";

function safeFetch(url, role, setter) {
  fetch(url, { headers: { "X-Role": role } })
    .then((res) => { if (!res.ok) return null; return res.json(); })
    .then((data) => { if (Array.isArray(data) && data.length) setter(data); })
    .catch(() => {});
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "10px 14px", fontSize: 13,
    }}>
      <p style={{ margin: "0 0 4px", color: "var(--color-text-secondary)" }}>{label || payload[0]?.name}</p>
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-primary)" }}>{payload[0]?.value} queries</p>
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "10px 14px", fontSize: 13,
    }}>
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-primary)" }}>
        {payload[0]?.name}: {payload[0]?.value}
      </p>
    </div>
  );
};

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "var(--color-background-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "1rem", flex: 1, minWidth: 0,
    }}>
      <p style={{ margin: "0 0 6px", fontSize: 12, color: "var(--color-text-secondary)" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 24, fontWeight: 500, color: accent || "var(--color-text-primary)" }}>{value ?? "—"}</p>
    </div>
  );
}

function SectionCard({ title, children }) {
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      padding: "1.5rem",
    }}>
      <p style={{
        margin: "0 0 1.25rem", fontSize: 11, fontWeight: 500,
        color: "var(--color-text-secondary)",
        textTransform: "uppercase", letterSpacing: "0.08em",
      }}>{title}</p>
      {children}
    </div>
  );
}

export default function AdminAnalytics() {
  const [questions, setQuestions] = useState([]);
  const [tools,     setTools]     = useState([]);
  const [intent,    setIntent]    = useState([]);

  useEffect(() => {
    safeFetch(`${BASE}/analytics/top-questions`,   "admin", setQuestions);
    safeFetch(`${BASE}/analytics/top-tools`,       "admin", setTools);
    safeFetch(`${BASE}/analytics/intent-breakdown`,"admin", setIntent);
  }, []);

  const totalQueries = tools.reduce((s, t) => s + (t.count || 0), 0);
  const topTool      = tools[0]?.tool ?? "—";
  const intentTotal  = intent.reduce((s, i) => s + i.value, 0);
  const problemPct   = intentTotal
    ? Math.round(((intent.find(i => i.name === "Problem")?.value ?? 0) / intentTotal) * 100)
    : null;

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Summary strip */}
      <div style={{ display: "flex", gap: 12 }}>
        <StatCard label="Total queries" value={totalQueries || "—"} />
        <StatCard label="Top tool" value={topTool} accent={PURPLE} />
        <StatCard label="Problem queries" value={problemPct != null ? `${problemPct}%` : "—"} accent={CORAL} />
      </div>

      {/* Top questions bar */}
      <SectionCard title="Top questions">
        {questions.length === 0 ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>No data yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={questions} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="question" hide />
                <YAxis tick={{ fontSize: 12, fill: "#888780" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-background-secondary)" }} />
                <Bar dataKey="count" fill={PURPLE} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: 4 }}>
              {questions.map((q, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 13, padding: "6px 10px",
                  borderRadius: "var(--border-radius-md)",
                  background: i === 0 ? "#EEEDFE" : "transparent",
                }}>
                  <span style={{
                    color: i === 0 ? "#3C3489" : "var(--color-text-secondary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%",
                  }}>
                    {i === 0 && <span style={{ marginRight: 6, fontWeight: 500 }}>#1</span>}
                    {q.question}
                  </span>
                  <span style={{ fontWeight: 500, color: i === 0 ? "#534AB7" : "var(--color-text-primary)", flexShrink: 0 }}>
                    {q.count}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>

        {/* Tool popularity — horizontal bars */}
        <SectionCard title="Tool popularity">
          {tools.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>No data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(180, tools.length * 48 + 40)}>
              <BarChart data={tools} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 12, fill: "#888780" }} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="tool" type="category" width={120}
                  tick={{ fontSize: 13, fill: "var(--color-text-secondary)" }}
                  tickLine={false} axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-background-secondary)" }} />
                <Bar dataKey="count" fill={TEAL} radius={[0, 4, 4, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        {/* Intent donut */}
        <SectionCard title="Query intent">
          {intent.length === 0 ? (
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>No data yet.</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}>
                {intent.map((item, i) => {
                  const pct = intentTotal ? Math.round((item.value / intentTotal) * 100) : 0;
                  return (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--color-text-secondary)" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i], flexShrink: 0 }} />
                      {item.name} {pct}%
                    </span>
                  );
                })}
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={intent} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                    paddingAngle={3} strokeWidth={0}
                  >
                    {intent.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
