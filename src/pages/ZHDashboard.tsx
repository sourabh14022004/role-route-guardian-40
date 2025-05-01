
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
import { BarChart2, Users, ClipboardCheck, TrendingUp } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getActiveBHRsCount, getTotalBranchVisitsInMonth } from "@/services/reportService";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";

const ZHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeBHRs, setActiveBHRs] = useState(0);
  const [totalBHRs, setTotalBHRs] = useState(0);
  const [monthlyCoverage, setMonthlyCoverage] = useState(0);
  const [totalBranches, setTotalBranches] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [selectedBHId, setSelectedBHId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get active BHRs count - BHRs who submitted at least one report in the current month
        const activeBHRsCount = await getActiveBHRsCount();
        setActiveBHRs(activeBHRsCount);
        
        // Get total BHRs under this ZH
        const { data: bhData, error: bhError } = await supabase
          .from("profiles")
          .select("count", { count: 'exact', head: true })
          .eq("role", "BH");
        
        if (bhError) throw bhError;
        setTotalBHRs(bhData || 0);
        
        // Get total branches count
        const { data: branchData, error: branchError } = await supabase
          .from("branches")
          .select("count", { count: 'exact', head: true });
        
        if (branchError) throw branchError;
        setTotalBranches(branchData || 0);
        
        // Get monthly visit coverage
        const monthlyVisitsCount = await getTotalBranchVisitsInMonth();
        const coverage = totalBranches > 0 ? Math.round((monthlyVisitsCount / totalBranches) * 100) : 0;
        setMonthlyCoverage(coverage);
        
        // Get recent reports
        const { data: reports, error: reportsError } = await supabase
          .from("branch_visits")
          .select(`
            id,
            visit_date,
            status,
            user_id,
            profiles:user_id (full_name, e_code),
            branches:branch_id (name, location)
          `)
          .order("visit_date", { ascending: false })
          .limit(5);
        
        if (reportsError) throw reportsError;
        setRecentReports(reports || []);
        
      } catch (error) {
        console.error("Error fetching ZH dashboard data:", error);
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
  }, [user, totalBranches]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const getStatusClass = (status: string) => {
    switch(status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  const handleViewBHR = (bhId: string) => {
    setSelectedBHId(bhId);
    setIsModalOpen(true);
  };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">ZH Dashboard</h1>
      <p className="text-lg text-slate-600 mb-8">
        Monitor branch coverage and BHR performance.
      </p>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <Users className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-3xl font-bold">{activeBHRs}</div>
                  <p className="text-sm text-slate-500">Active BHRs this month</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <BarChart2 className="h-8 w-8 text-amber-500 mb-2" />
                  <div className="text-3xl font-bold">{totalBranches}</div>
                  <p className="text-sm text-slate-500">Total Branches</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <ClipboardCheck className="h-8 w-8 text-emerald-500 mb-2" />
                  <div className="text-3xl font-bold">{monthlyCoverage}%</div>
                  <p className="text-sm text-slate-500">Monthly Coverage</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-8 w-8 text-violet-500 mb-2" />
                  <div className="text-3xl font-bold">78%</div>
                  <p className="text-sm text-slate-500">Performance Score</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>BHR Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Active vs Total BHRs</p>
                    <p className="text-sm text-slate-500">{activeBHRs} / {totalBHRs}</p>
                  </div>
                  <Progress value={(activeBHRs / totalBHRs) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Branch Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Monthly Progress</p>
                    <p className="text-sm text-slate-500">{monthlyCoverage}%</p>
                  </div>
                  <Progress value={monthlyCoverage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Branch Visit Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No reports found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium">BHR</th>
                        <th className="pb-3 font-medium">Branch</th>
                        <th className="pb-3 font-medium">Visit Date</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-b last:border-0">
                          <td className="py-3">
                            {report.profiles?.full_name || "Unknown"}<br />
                            <span className="text-xs text-slate-500">{report.profiles?.e_code}</span>
                          </td>
                          <td className="py-3">
                            {report.branches?.name || "Unknown"}<br />
                            <span className="text-xs text-slate-500">{report.branches?.location}</span>
                          </td>
                          <td className="py-3">{formatDate(report.visit_date)}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusClass(report.status)}`}>
                              {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewBHR(report.user_id)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={() => navigate("/zh/review-reports")}
              >
                View All Reports
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
      
      {/* BHR Details Modal */}
      <BHRDetailsModal 
        bhId={selectedBHId} 
        open={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBHId(null);
        }}
      />
    </div>
  );
};

export default ZHDashboard;
