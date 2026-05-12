// UserAnalytics.jsx
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const PURPLE  = "#7F77DD";
const PURPLE2 = "#AFA9EC";
const BASE    = "http://127.0.0.1:8000";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-secondary)",
      borderRadius: "var(--border-radius-md)",
      padding: "10px 14px", fontSize: 13,
    }}>
      <p style={{ margin: "0 0 4px", color: "var(--color-text-secondary)", maxWidth: 200 }}>
        {payload[0]?.payload?.question}
      </p>
      <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text-primary)" }}>
        {payload[0]?.value} searches
      </p>
    </div>
  );
};

export default function UserAnalytics({ user }) {
  const [myStats, setMyStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    setError(false);

    fetch(`${BASE}/analytics/user/${user.id}`, { headers: { "X-Role": "employee" } })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMyStats(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("UserAnalytics fetch failed:", err);
        setError(true);
        setLoading(false);
      });
  }, [user?.id]);

  const totalSearches = myStats.reduce((s, x) => s + (x.count || 0), 0);
  const topTopic      = myStats[0]?.question ?? null;

  return (
    <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

      {/* Header */}
      <div style={{
        borderLeft: `3px solid ${PURPLE}`,
        paddingLeft: "1rem",
      }}>
        <p style={{ margin: 0, fontSize: 20, fontWeight: 500, color: "var(--color-text-primary)" }}>
          Your learning insights
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--color-text-secondary)" }}>
          Topics you've explored most with the AI mentor
        </p>
      </div>

      {/* Summary pills */}
      {myStats.length > 0 && (
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            background: "#EEEDFE", borderRadius: "var(--border-radius-md)",
            padding: "0.75rem 1rem", flex: 1, minWidth: 0,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#534AB7", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Total searches
            </p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 500, color: "#3C3489" }}>{totalSearches}</p>
          </div>
          <div style={{
            background: "#E1F5EE", borderRadius: "var(--border-radius-md)",
            padding: "0.75rem 1rem", flex: 2, minWidth: 0,
          }}>
            <p style={{ margin: "0 0 4px", fontSize: 11, color: "#0F6E56", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Top topic
            </p>
            <p style={{
              margin: 0, fontSize: 14, fontWeight: 500, color: "#085041",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {topTopic ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* Chart + list */}
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "1.5rem",
      }}>
        {loading ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>Loading…</p>
        ) : error ? (
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: 0 }}>
            Couldn't load your stats right now. Try again shortly.
          </p>
        ) : myStats.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
            <p style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              No activity yet
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-secondary)" }}>
              Start chatting to see your insights here.
            </p>
          </div>
        ) : (
          <>
            <p style={{
              margin: "0 0 1rem", fontSize: 11, fontWeight: 500,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              Searches by topic
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={myStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <XAxis dataKey="question" hide />
                <YAxis tick={{ fontSize: 12, fill: "#888780" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--color-background-secondary)" }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {myStats.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? PURPLE : PURPLE2} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: 4 }}>
              {myStats.map((item, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  fontSize: 13, padding: "6px 10px",
                  borderRadius: "var(--border-radius-md)",
                  background: i === 0 ? "#EEEDFE" : "transparent",
                  transition: "background 0.15s",
                }}>
                  <span style={{
                    color: i === 0 ? "#3C3489" : "var(--color-text-secondary)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "80%",
                  }}>
                    {item.question}
                  </span>
                  <span style={{
                    fontWeight: 500,
                    color: i === 0 ? "#534AB7" : "var(--color-text-primary)",
                    flexShrink: 0, marginLeft: 8,
                  }}>
                    {item.count}×
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}