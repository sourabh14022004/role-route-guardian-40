
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "@/lib/auth";

const AdminDashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated and has admin role
    if (!isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    const user = getCurrentUser();
    if (!user || user.role !== "admin") {
      navigate("/auth");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-lg text-slate-600 mb-8">
          Welcome to the admin dashboard. Manage users and system settings here.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {["Total Users", "Active Now", "New Today", "Pending Approvals"].map((title, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
              <p className="text-2xl font-bold">{Math.floor(Math.random() * 1000)}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
          <h2 className="font-medium text-lg mb-4">Recent Users</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pb-3 font-medium">Name</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "John Doe", role: "BH", location: "New York", status: "Active" },
                  { name: "Jane Smith", role: "ZH", location: "London", status: "Active" },
                  { name: "Mike Johnson", role: "CH", location: "Toronto", status: "Inactive" },
                  { name: "Sarah Williams", role: "BH", location: "Sydney", status: "Active" },
                ].map((user, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3">{user.name}</td>
                    <td className="py-3">{user.role}</td>
                    <td className="py-3">{user.location}</td>
                    <td className="py-3">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        user.status === "Active" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-slate-100 text-slate-800"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
