import { useState } from "react";
import { useLocation } from "react-router-dom";
import SideBar from "./SideBar";
import ProfilePage from "./ProfilePage";
import Dashboard from "./DashboardHome";
import AiMentorPage from "./AiMentorPage";
import ComingSoonPage from "./ComingSoonPage";
import AdminAnalytics from "./AdminAnalytics";

export default function MainPage() {
  const location = useLocation();
  const activeRole = location.state?.role || "Freshers";
  const userName = location.state?.name || "User";

  // Default to 'mentor' so your best feature shows first
  const [activeTab, setActiveTab] = useState("mentor");

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans selection:bg-indigo-100">
      <SideBar
        activeRole={activeRole}
        userName={userName}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 overflow-y-auto relative">
        {/* Background Decorative Blur */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-200/30 rounded-full blur-[120px] -z-10"></div>

        {/* 1. AI Mentor (Primary Feature) */}
        {activeTab === "mentor" && <AiMentorPage activeRole={activeRole} />}

        {activeTab === "analytics" && <AdminAnalytics />}

        {/* 2. Coming Soon Pages (Secondary Features) */}
        {(activeTab === "dashboard" || activeTab === "resources" || activeTab === "profile") && (
          <ComingSoonPage title={activeTab} />
        )}
        
      </main>
    </div>
  );
}