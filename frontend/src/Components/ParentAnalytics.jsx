import AdminAnalytics from "./AdminAnalytics";
import ManagerAnalytics from "./ManagerAnalytics";
import UserAnalytics from "./UserAnalytics";

export default function AnalyticsContainer() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // Normalize the role string to lowercase to match backend expectations
  const rawRole = user.role?.toLowerCase() || "";

  return (
    <div className="min-h-screen bg-slate-50">
      {rawRole === "admin" && <AdminAnalytics />}
      {rawRole === "manager" && <ManagerAnalytics />}
      {/* Group all intern/employee variants into the UserAnalytics view */}
      {(rawRole === "employee" || rawRole === "user" || rawRole.includes("intern")) && (
        <UserAnalytics />
      )}
    </div>
  );
}