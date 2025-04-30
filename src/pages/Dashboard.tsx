
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, session, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;
    
    // Check if user is authenticated
    if (!session || !user) {
      navigate("/auth");
      return;
    }
    
    // Redirect to role-specific dashboard if user gets here directly
    const redirectToRoleDashboard = async () => {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profileData?.role) {
          navigate(`/${profileData.role.toLowerCase()}/dashboard`);
        }
      } catch (error) {
        console.error("Error redirecting to role dashboard:", error);
      }
    };
    
    redirectToRoleDashboard();
  }, [navigate, session, user, loading]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
        <p className="text-lg text-slate-600">
          Welcome to your dashboard! Redirecting to your role-specific dashboard...
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
