// ManagerAnalytics.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const INDIGO = "#534AB7";
const COLORS = ["#7F77DD", "#AFA9EC", "#CECBF6", "#9FE1CB", "#5DCAA5"];
const BASE   = "http://127.0.0.1:8000";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "10px 14px", fontSize: 13, maxWidth: 240,
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 500, color: "var(--color-text-primary)" }}>{d?.employee}</p>
      <p style={{ margin: "0 0 4px", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
        "{d?.question}"
      </p>
      <p style={{ margin: 0, color: INDIGO, fontWeight: 500 }}>{payload[0]?.value} queries</p>
    </div>
  );
};

export default function ManagerAnalytics() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    fetch(`${BASE}/analytics/manager`, { headers: { "X-Role": "manager" } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d) => {
        setData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("ManagerAnalytics fetch failed:", err);
        setError(true);
        setLoading(false);
      });
  }, []);

  // Unique employees for summary strip
  const employees  = [...new Set(data.map(d => d.employee))];
  const totalQ     = data.reduce((s, d) => s + (d.count || 0), 0);
  const topStruggle = data[0]?.question ?? null;

  const chartHeight = Math.max(240, data.length * 52 + 60);

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{ borderLeft: "3px solid #534AB7", paddingLeft: "1rem" }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Team engagement
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--color-text-secondary)" }}>
          Top struggle areas per employee
        </p>
      </div>

      {/* Summary strip — only when data is loaded */}
      {data.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", flex: 1,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-secondary)" }}>Employees tracked</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{employees.length}</p>
          </div>
          <div style={{
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", flex: 1,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "var(--color-text-secondary)" }}>Total queries logged</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "var(--color-text-primary)" }}>{totalQ}</p>
          </div>
          {topStruggle && (
            <div style={{
              background: "#EEEDFE",
              borderRadius: "var(--border-radius-md)", padding: "0.75rem 1rem", flex: 2, minWidth: 0,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 12, color: "#534AB7" }}>Top struggle area</p>
              <p style={{
                margin: 0, fontSize: 13, fontWeight: 500, color: "#3C3489",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {topStruggle}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Chart */}
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
        }}>
          Queries by employee
        </p>

        {loading ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>Loading…</p>
        ) : error ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
            Couldn't load team data right now. Try again shortly.
          </p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              No team data yet
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
              Data will appear once employees start using the AI mentor.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 12, fill: "#888780" }} tickLine={false} axisLine={false} />
              <YAxis
                dataKey="employee" type="category" width={100}
                tick={{ fontSize: 13, fill: "var(--color-text-secondary)" }}
                tickLine={false} axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-background-secondary)" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={32}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Employee breakdown table */}
      {data.length > 0 && (
        <div style={{
          background: "var(--color-background-primary)",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "var(--border-radius-lg)",
          padding: "1.5rem",
        }}>
          <p style={{
            margin: "0 0 1rem", fontSize: 11, fontWeight: 500,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase", letterSpacing: "0.08em",
          }}>
            Detailed breakdown
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "8px 10px", borderRadius: "var(--border-radius-md)",
                background: i % 2 === 0 ? "var(--color-background-secondary)" : "transparent",
                fontSize: 13,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: COLORS[i % COLORS.length],
                }} />
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)", minWidth: 100, flexShrink: 0 }}>
                  {item.employee}
                </span>
                <span style={{
                  color: "var(--color-text-secondary)", flex: 1,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {item.question}
                </span>
                <span style={{ fontWeight: 500, color: INDIGO, flexShrink: 0 }}>{item.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}