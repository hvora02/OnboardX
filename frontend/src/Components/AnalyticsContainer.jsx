import AdminAnalytics from "./AdminAnalytics";
import ManagerAnalytics from "./ManagerAnalytics";
import UserAnalytics from "./UserAnalytics";

export default function AnalyticsContainer() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const rawRole = (user.role || "").toLowerCase().trim();

  const getRole = (raw) => {
    if (raw === "admin") return "admin";
    if (raw === "manager" || raw.startsWith("manager")) return "manager";
    if (raw === "employee" || raw === "user" || raw.startsWith("intern")) return "employee";
    return null;
  };

  const role = getRole(rawRole);

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      {role === "admin"    && <AdminAnalytics />}
      {role === "manager"  && <ManagerAnalytics />}
      {role === "employee" && <UserAnalytics user={user} />}
      {!role && (
        <div className="p-20 text-center">
          <p className="text-slate-400">Unknown role: "{rawRole}". Please re-login.</p>
        </div>
      )}
    </div>
  );
}