import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardXWelcome() {
  const [selectedRole, setSelectedRole] = useState("");
  const [userName, setUserName] = useState(""); 
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const roles = ["User", "Manager", "Admin"];

  const handleStart = () => {
    if (selectedRole && userName.trim()) {

      const validUsers = {
        "intern a": "user",
        "intern b": "user",
        "intern c": "user",
        "manager a": "manager",
        "manager b": "manager",
        "admin": "admin"
      };

      const normalizedName = userName.trim().toLowerCase();
      const normalizedRole = selectedRole.toLowerCase();

      if (validUsers[normalizedName] !== normalizedRole) {
        setError("This user is not registered with that role");
        return;
      }

      const userData = {
        name: normalizedName,
        role: normalizedRole
      };

      localStorage.setItem("user", JSON.stringify(userData));

      const session_id = crypto.randomUUID();
      localStorage.setItem("session_id", session_id);
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center relative overflow-hidden">

      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-200 rounded-full blur-3xl opacity-40"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-200 rounded-full blur-3xl opacity-40"></div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 w-[420px] relative z-10">

        {/* Logo + Title */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            
            <h1 className="text-xl font-bold text-indigo-600">
             🤖  OnboardX
            </h1>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Your Team’s Onboarding Copilot
          </p>
        </div>

        {/* Welcome */}
        <div className="mt-6 text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            Welcome Aboard! 👋
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Let’s personalise your onboarding experience.
          </p>
        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500 mb-2">What's your name?</p>
          <input
            type="text"
            placeholder="e.g. Intern A / Manager A"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              setError("");
            }}
            className={`w-full border px-4 py-3 rounded-xl bg-gray-50 focus:outline-none transition-colors
              ${error ? "border-red-400" : "border-gray-200 focus:border-indigo-400"}
            `}
          />
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>

        {/* Dropdown */}
        <div className="mt-6 relative">
          <p className="text-sm text-gray-500 mb-2">
            Select Your Role
          </p>

          {/* Selected */}
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex justify-between items-center border border-gray-200 px-4 py-3 rounded-xl text-gray-700 bg-gray-50 hover:border-gray-300"
          >
            {selectedRole || <span className="text-gray-400">Select</span>}
            <span className="text-gray-400">▾</span>
          </button>

          {/* Options */}
          {open && (
            <div className="absolute mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-md z-20">
              {roles.map((role) => (
                <div
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setOpen(false);
                  }}
                  className={`px-4 py-3 text-sm cursor-pointer hover:bg-gray-100 ${
                    selectedRole === role ? "bg-indigo-50 font-medium" : ""
                  }`}
                >
                  {role}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Button (Gradient like your image) */}
        <button
          onClick={handleStart}
          disabled={!selectedRole || !userName.trim()}
          className={`mt-6 w-full py-3 rounded-xl font-semibold text-white transition-all ${
            selectedRole && userName.trim()
              ? "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 shadow-md"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          Get Started →
        </button>
      </div>
    </div>
  );
}