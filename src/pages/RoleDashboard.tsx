
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const RoleDashboard = () => {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;
    
    // Check if user is authenticated
    if (!session || !user) {
      navigate("/auth");
      return;
    }
    
    // Verify user role matches the requested dashboard
    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        
        const validRoles = ["bh", "zh", "ch", "admin"];
        
        if (!data || data.role.toLowerCase() !== role?.toLowerCase() || !validRoles.includes(role?.toLowerCase() || "")) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You don't have permission to view this page."
          });
          navigate("/auth");
        }
      } catch (error) {
        console.error("Error verifying user role:", error);
        navigate("/auth");
      }
    };
    
    checkUserRole();
  }, [navigate, role, session, user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const getRoleName = () => {
    switch(role) {
      case "bh": return "Branch Head";
      case "zh": return "Zone Head";
      case "ch": return "Country Head";
      default: return role?.toUpperCase() || "User";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{getRoleName()} Dashboard</h1>
        <p className="text-lg text-slate-600 mb-8">
          Welcome to your role-specific dashboard. View and manage your tasks here.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {["Tasks", "Reports", "Team Members"].map((title, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
              <p className="text-2xl font-bold">{Math.floor(Math.random() * 100)}</p>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="font-medium text-lg mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {[
                "Updated team schedule",
                "Approved expense report",
                "Submitted monthly review",
                "Added new team member"
              ].map((activity, i) => (
                <div key={i} className="flex items-start pb-4 border-b last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-medium">{activity}</p>
                    <p className="text-sm text-slate-500">
                      {Math.floor(Math.random() * 24)} hours ago
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 border border-slate-200">
            <h2 className="font-medium text-lg mb-4">Upcoming Tasks</h2>
            <div className="space-y-2">
              {[
                "Performance reviews",
                "Budget planning",
                "Team meeting",
                "Training session",
                "Report submission"
              ].map((task, i) => (
                <div key={i} className="flex items-center py-2 border-b last:border-0">
                  <input type="checkbox" className="h-4 w-4 mr-3" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDashboard;
