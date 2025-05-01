
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FilePlus, Users, Calendar, ClipboardCheck, TrendingUp } from "lucide-react";
import { 
  getBranchVisitStats, 
  getBranchCategoryCoverage,
  getVisitMetrics 
} from "@/services/branchService";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

type BranchCategoryStats = {
  category: string;
  completion: number;
  color: string;
};

const BHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Branch visit stats
  const [stats, setStats] = useState({
    assignedBranches: 0,
    branchesVisited: 0,
    pendingVisits: 0,
    completionRate: 0,
  });
  
  const [branchCategories, setBranchCategories] = useState<BranchCategoryStats[]>([
    { category: "platinum", completion: 0, color: "bg-violet-500" },
    { category: "diamond", completion: 0, color: "bg-blue-500" },
    { category: "gold", completion: 0, color: "bg-amber-500" },
    { category: "silver", completion: 0, color: "bg-slate-400" },
    { category: "bronze", completion: 0, color: "bg-orange-700" },
  ]);
  
  const [visitMetrics, setVisitMetrics] = useState({
    hrConnectSessions: { completed: 0, total: 0 },
    avgParticipation: 0,
    employeeCoverage: 0,
    newEmployeeCoverage: 0,
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        return;
      }
      
      setIsLoading(true);
      try {
        // Fetch profile from local storage or Supabase
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }
        
        // Fetch branch visit stats
        const visitStats = await getBranchVisitStats(user.id);
        setStats(visitStats);
        
        // Fetch branch category coverage
        const categoryCoverage = await getBranchCategoryCoverage(user.id);
        setBranchCategories(categoryCoverage);
        
        // Fetch visit metrics
        const metrics = await getVisitMetrics(user.id);
        setVisitMetrics(metrics);
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load dashboard data.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);
  
  // Format category names for display
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Welcome section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome, {profile?.full_name || "Branch Head"}
        </h1>
        <p className="text-slate-600 mt-1">
          Here's an overview of your branch visits and performance metrics
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-600">Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center">
                <div className="bg-blue-100 p-2 rounded-full mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Assigned Branches</p>
                <p className="text-3xl font-bold">{stats.assignedBranches}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center">
                <div className="bg-green-100 p-2 rounded-full mb-3">
                  <ClipboardCheck className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Branches Visited</p>
                <p className="text-3xl font-bold">{stats.branchesVisited}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center">
                <div className="bg-amber-100 p-2 rounded-full mb-3">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Pending Visits</p>
                <p className="text-3xl font-bold">{stats.pendingVisits}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 md:p-6 flex flex-col items-center justify-center">
                <div className="bg-violet-100 p-2 rounded-full mb-3">
                  <TrendingUp className="h-6 w-6 text-violet-600" />
                </div>
                <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
              </CardContent>
            </Card>
          </div>
          
          {/* Branch visit progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Branch Visit Progress</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium">Current Month</h3>
                      <span className="text-sm font-semibold">
                        {stats.completionRate}%
                      </span>
                    </div>
                    <Progress value={stats.completionRate} className="h-2 bg-slate-200" />
                  </div>
                  
                  <div className="pt-2">
                    <h3 className="text-sm font-medium mb-3">Branch Categories</h3>
                    <div className="space-y-3">
                      {branchCategories.map((cat) => (
                        <div key={cat.category}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs">{formatCategoryName(cat.category)}</span>
                            <span className="text-xs font-medium">{cat.completion}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full ${cat.color}`} 
                              style={{ width: `${cat.completion}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Visit Metrics</CardTitle>
              </CardHeader>
              <CardContent className="px-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm">HR Connect Sessions</p>
                    <p className="text-sm font-medium">
                      {visitMetrics.hrConnectSessions.completed}/{visitMetrics.hrConnectSessions.total}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Avg. Participation</p>
                    <p className="text-sm font-medium">{visitMetrics.avgParticipation}%</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">Employee Coverage</p>
                    <p className="text-sm font-medium">{visitMetrics.employeeCoverage}%</p>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-sm">New Employee Coverage</p>
                    <p className="text-sm font-medium">{visitMetrics.newEmployeeCoverage}%</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  onClick={() => navigate("/bh/new-visit")}
                  className="w-full flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <FilePlus className="h-4 w-4" />
                  Create New Visit
                </Button>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default BHDashboard;
