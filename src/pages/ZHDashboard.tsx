
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
import { BarChart2, Users, ClipboardCheck } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getActiveBHRsCount, getTotalBranchVisitsInMonth } from "@/services/reportService";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const ZHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeBHRs, setActiveBHRs] = useState(0);
  const [totalBHRs, setTotalBHRs] = useState(0);
  const [totalBranches, setTotalBranches] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryData, setCategoryData] = useState<{name: string; value: number; color: string}[]>([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get active BHRs count - BHRs who submitted at least one report in the current month
        const activeBHRsCount = await getActiveBHRsCount();
        setActiveBHRs(activeBHRsCount);
        
        // Get total BHRs under this ZH
        const { count: bhCount, error: bhError } = await supabase
          .from("profiles")
          .select("count", { count: 'exact', head: true })
          .eq("role", "BH");
        
        if (bhError) throw bhError;
        setTotalBHRs(bhCount || 0);
        
        // Get total branches count
        const { count: branchCount, error: branchError } = await supabase
          .from("branches")
          .select("count", { count: 'exact', head: true });
        
        if (branchError) throw branchError;
        setTotalBranches(branchCount || 0);
        
        // Get branch category stats for pie chart
        const { data: categoryStats, error: categoryError } = await supabase
          .from("branch_visits")
          .select(`
            branches:branch_id (category)
          `)
          .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        if (categoryError) throw categoryError;
        
        // Process category data for pie chart
        const categories: Record<string, number> = {};
        categoryStats?.forEach((item) => {
          const category = (item.branches as any)?.category || 'unknown';
          categories[category] = (categories[category] || 0) + 1;
        });
        
        const colors = {
          'platinum': '#9333ea', // purple
          'diamond': '#2563eb', // blue
          'gold': '#eab308',   // amber
          'silver': '#94a3b8', // slate
          'bronze': '#f97316', // orange
          'unknown': '#cbd5e1'  // slate light
        };
        
        const categoryChartData = Object.entries(categories).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
          color: colors[name as keyof typeof colors] || '#cbd5e1'
        }));
        
        setCategoryData(categoryChartData);
        
        // Get recent reports
        const { data: reports, error: reportsError } = await supabase
          .from("branch_visits")
          .select(`
            id,
            visit_date,
            status,
            user_id,
            branch_id,
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
  }, [user]);
  
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
  
  const handleViewReport = (reportId: string) => {
    setSelectedReportId(reportId);
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                  <div className="text-3xl font-bold">{recentReports.length}</div>
                  <p className="text-sm text-slate-500">Recent Reports</p>
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
                <CardTitle>Branch Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <div className="h-[200px] w-full">
                    <ChartContainer 
                      config={{
                        platinum: { color: '#9333ea' },
                        diamond: { color: '#2563eb' },
                        gold: { color: '#eab308' },
                        silver: { color: '#94a3b8' },
                        bronze: { color: '#f97316' },
                        unknown: { color: '#cbd5e1' }
                      }}
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-2 border rounded shadow-md">
                                    <p className="font-medium">{data.name}: {data.value} reports</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-slate-500">No category data available</p>
                  </div>
                )}
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
                              onClick={() => handleViewReport(report.id)}
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
      
      {/* Branch Visit Details Modal */}
      <BranchVisitDetailsModal 
        visit={recentReports.find(r => r.id === selectedReportId)} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedReportId(null);
        }}
      />
    </div>
  );
};

export default ZHDashboard;
