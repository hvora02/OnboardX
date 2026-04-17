export default function SideBar({ activeRole, userName, activeTab, setActiveTab }) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "mentor", label: "AI Mentor", icon: "💬" },
    { id: "resources", label: "Resources", icon: "📚" },
    { id: "profile", label: "Profile", icon: "👤" }, // This is the button
  ];

  return (
    <div className="w-72 bg-[#1e293b] h-screen flex flex-col text-slate-300">
      <h1 className="text-xl font-bold text-white p-6">🤖 OnboardX</h1>
      
      {/* Role Display (No dropdown) */}
      <div className="px-6 mb-8">
        <label className="text-[10px] text-slate-500 block mb-2 uppercase font-bold">Active Path</label>
        <div className="bg-slate-800 p-3 rounded-lg text-white text-sm font-semibold">✨ {activeRole}</div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)} // <--- THIS SWITCHES THE PAGE
            className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer ${
              activeTab === item.id ? "bg-indigo-600 text-white" : "hover:bg-slate-800"
            }`}
          >
            {item.icon} <span>{item.label}</span>
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-6 border-t border-slate-800 text-white font-bold">
        {userName}
      </div>
    </div>
  );
}