import { useState } from "react";

export default function ProfilePage({ initialName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(""); // Company Designation
  const [manager, setManager] = useState("");
  const [email, setEmail] = useState("");

  return (
    <div className="p-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <input 
              value={name} onChange={(e) => setName(e.target.value)} 
              disabled={!isEditing} className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Designation</label>
            <input 
              value={role} onChange={(e) => setRole(e.target.value)} 
              disabled={!isEditing} className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Manager Name</label>
            <input 
              value={manager} onChange={(e) => setManager(e.target.value)} 
              disabled={!isEditing} className="w-full border p-2 rounded" 
            />
          </div>
          <div>
            <label className="text-sm text-gray-500">Email ID</label>
            <input 
              value={email} onChange={(e) => setEmail(e.target.value)} 
              disabled={!isEditing} className="w-full border p-2 rounded" 
            />
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg mt-4"
          >
            {isEditing ? "Save Details" : "Edit Profile"}
          </button>
        </div>
      </div>
    </div>
  );
}