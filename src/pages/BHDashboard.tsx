
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FilePlus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const BHDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [user]);
  
  // Mock upcoming visits data
  const upcomingVisits = [
    { 
      id: 1, 
      branch: "Branch 103 - Andheri", 
      date: "Tomorrow, 10:00 AM", 
      category: "Platinum" 
    },
    { 
      id: 2, 
      branch: "Branch 087 - Bandra", 
      date: "Sep 15, 2:30 PM", 
      category: "Diamond" 
    },
    { 
      id: 3, 
      branch: "Branch 042 - Dadar", 
      date: "Sep 18, 11:00 AM", 
      category: "Gold" 
    }
  ];
  
  const branchCategories = [
    { name: "Platinum", value: 100, color: "bg-cyan-500" },
    { name: "Diamond", value: 80, color: "bg-blue-500" },
    { name: "Gold", value: 60, color: "bg-amber-500" },
    { name: "Silver", value: 40, color: "bg-slate-400" },
    { name: "Bronze", value: 20, color: "bg-orange-500" },
  ];
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome, {profile?.full_name || "Branch Head"}</h1>
          <p className="text-slate-600">Track your branch visit progress and upcoming assignments</p>
        </div>
        
        <Button 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" 
          onClick={() => navigate("/bh/new-visit")}
        >
          <FilePlus className="h-5 w-5" />
          New Visit Form
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Assigned Branches" 
          value={12} 
          icon={<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M9 9h.01" /><path d="M15 15h.01" /><path d="M9 15h.01" /><path d="M15 9h.01" /></svg>
          </div>} 
        />
        
        <StatCard 
          title="Branches Visited" 
          value={9} 
          icon={<div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
          </div>} 
        />
        
        <StatCard 
          title="Pending Visits" 
          value={3} 
          icon={<div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>} 
        />
        
        <StatCard 
          title="Completion Rate" 
          value="75%" 
          icon={<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 21H3M21 7V3h-4M3 17V21h4M3 7V3h4M10 21v-4M14 21v-8M10 3v8M14 3v4" /></svg>
          </div>} 
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Visit Progress */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Branch Visit Progress</h2>
                <div className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Current Month</div>
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2.5 bg-slate-200" indicatorClassName="bg-blue-600" />
              </div>
            
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Branch Categories */}
                <div className="space-y-4">
                  <h3 className="text-base font-medium">Branch Categories</h3>
                  <div className="space-y-3">
                    {branchCategories.map((category) => (
                      <div key={category.name}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">{category.name}</span>
                          <span className="text-sm font-medium">{category.value}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${category.color}`} 
                            style={{ width: `${category.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Visit Metrics */}
                <div>
                  <h3 className="text-base font-medium mb-4">Visit Metrics</h3>
                  <div className="space-y-3">
                    <MetricItem label="HR Connect Sessions" value="8/9" />
                    <MetricItem label="Avg. Participation" value="85%" />
                    <MetricItem label="Employee Coverage" value="76%" />
                    <MetricItem label="New Employee Coverage" value="92%" />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Upcoming Visits */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-4 md:p-6">
              <h2 className="text-xl font-semibold mb-4">Upcoming Visits</h2>
              <div className="space-y-4">
                {upcomingVisits.map((visit) => (
                  <div key={visit.id} className="p-3 border rounded-lg bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium">{visit.branch}</h4>
                        <div className="flex items-center text-sm text-slate-500 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                          {visit.date}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getBadgeColor(visit.category)}`}>
                        {visit.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper components
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => {
  return (
    <Card>
      <CardContent className="p-4 flex flex-col">
        <div className="flex items-start justify-between">
          {icon}
          <h3 className="text-sm text-slate-500 font-medium">{title}</h3>
        </div>
        <div className="text-2xl md:text-3xl font-bold mt-2">{value}</div>
      </CardContent>
    </Card>
  );
};

const MetricItem = ({ label, value }: { label: string, value: string }) => (
  <div className="flex items-center justify-between pb-1.5">
    <span className="text-sm text-slate-600">{label}</span>
    <span className="text-sm font-medium">{value}</span>
  </div>
);

// Helper function for category badge color
const getBadgeColor = (category: string) => {
  switch (category) {
    case 'Platinum':
      return 'bg-cyan-100 text-cyan-800';
    case 'Diamond':
      return 'bg-blue-100 text-blue-800';
    case 'Gold':
      return 'bg-amber-100 text-amber-800';
    case 'Silver':
      return 'bg-slate-100 text-slate-800';
    default:
      return 'bg-orange-100 text-orange-800';
  }
};

export default BHDashboard;
