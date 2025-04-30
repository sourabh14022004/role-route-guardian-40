
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getCurrentUser } from "@/lib/auth";

// This is a placeholder dashboard component
const Dashboard = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      navigate("/auth");
      return;
    }
    
    const user = getCurrentUser();
    if (!user) {
      navigate("/auth");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <p className="text-lg text-slate-600">
          Welcome to your dashboard! This is a placeholder that would show content based on your role.
        </p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
              <h3 className="font-medium mb-2">Card {i + 1}</h3>
              <p className="text-slate-500 text-sm">
                This is placeholder content for the dashboard. In a real application, 
                this would show data relevant to your role and responsibilities.
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
