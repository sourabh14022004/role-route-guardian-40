
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
    assignedBranches: 12,
    branchesVisited: 9,
    pendingVisits: 3,
    completionRate: 75,
  });
  
  const [branchCategories, setBranchCategories] = useState<BranchCategoryStats[]>([
    { category: "Platinum", completion: 100, color: "bg-violet-500" },
    { category: "Diamond", completion: 80, color: "bg-blue-500" },
    { category: "Gold", completion: 60, color: "bg-amber-500" },
    { category: "Silver", completion: 40, color: "bg-slate-400" },
    { category: "Bronze", completion: 20, color: "bg-orange-700" },
  ]);
  
  const [visitMetrics, setVisitMetrics] = useState({
    hrConnectSessions: { completed: 8, total: 9 },
    avgParticipation: 85,
    employeeCoverage: 76,
    newEmployeeCoverage: 92,
  });
  
  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) throw error;
        if (data) setProfile(data);
        
        // In a real app, here we would fetch real stats from Supabase
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile:", error);
        setIsLoading(false);
      }
    };
    
    getProfile();
  }, [user]);
  
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
                        <span className="text-xs">{cat.category}</span>
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
    </div>
  );
};

export default BHDashboard;
