import { useState } from "react";
import { useLocation } from "react-router-dom";
import SideBar from "./SideBar";
import ProfilePage from "./ProfilePage";
import Dashboard from "./DashboardHome";
import AiMentorPage from "./AiMentorPage";

export default function MainPage() {
  const location = useLocation();
  const activeRole = location.state?.role || "Freshers";
  const userName = location.state?.name || "User";

  // 1. ADD THIS STATE to handle page switching
  const [activeTab, setActiveTab] = useState("dashboard");

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

        {/* 3. CONDITIONAL RENDERING: Clean and Scalable */}
        {activeTab === "dashboard" && <Dashboard userName={userName} activeRole={activeRole} />}
        {activeTab === "profile" && <ProfilePage initialName={userName} />}
        {activeTab === "mentor" && <AiMentorPage/>}
        {activeTab === "resources" && <div className="=p-12"><h1>This is resource...</h1></div>}
      </main>
    </div>
  );
}