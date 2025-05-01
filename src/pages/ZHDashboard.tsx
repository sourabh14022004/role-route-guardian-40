
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
import { BarChart2, Users, ClipboardCheck, PieChart as PieChartIcon } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getActiveBHRsCount, getTotalBranchVisitsInMonth, fetchReportById } from "@/services/reportService";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

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
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
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
        
        // Get branch visits with their category information for real-time pie chart
        const { data: visits, error: visitsError } = await supabase
          .from("branch_visits")
          .select(`
            branches:branch_id (
              category
            )
          `)
          .in('status', ['submitted', 'approved'])
          .gte('visit_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
        
        if (visitsError) throw visitsError;
        
        // Process category data for pie chart based on actual visit data
        const categories: Record<string, number> = {
          'platinum': 0,
          'diamond': 0,
          'gold': 0,
          'silver': 0,
          'bronze': 0,
          'unknown': 0
        };
        
        if (visits && visits.length > 0) {
          visits.forEach((visit) => {
            const branchData = visit.branches as any;
            const category = branchData?.category?.toLowerCase() || 'unknown';
            categories[category] = (categories[category] || 0) + 1;
          });
        }
        
        const colors = {
          'platinum': '#9333ea', // purple
          'diamond': '#2563eb', // blue
          'gold': '#eab308',   // amber
          'silver': '#94a3b8', // slate
          'bronze': '#f97316', // orange
          'unknown': '#cbd5e1'  // slate light
        };
        
        const categoryChartData = Object.entries(categories)
          .filter(([_, value]) => value > 0) // Only include categories with visits
          .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: colors[name as keyof typeof colors] || '#cbd5e1'
          }));
        
        setCategoryData(categoryChartData);
        
        // Get recent reports with full details
        const { data: reports, error: reportsError } = await supabase
          .from("branch_visits")
          .select(`
            id,
            visit_date,
            status,
            user_id,
            branch_id,
            profiles:user_id (full_name, e_code),
            branches:branch_id (name, location, category)
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
  
  const handleViewReport = async (reportId: string) => {
    try {
      // Fetch complete report details with proper data
      const report = await fetchReportById(reportId);
      
      if (report) {
        setSelectedVisit(report);
        setIsModalOpen(true);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load report details.",
        });
      }
    } catch (error) {
      console.error("Error fetching report details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load report details.",
      });
    }
  };
  
  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Zone HR Dashboard</h1>
        <p className="text-lg text-slate-600">
          Monitor branch performance and BHR activity across your zone.
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600 mb-3">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{activeBHRs}</div>
                  <p className="text-sm text-slate-600 mt-1">Active BHRs this month</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-amber-100 text-amber-600 mb-3">
                    <BarChart2 className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{totalBranches}</div>
                  <p className="text-sm text-slate-600 mt-1">Total Branches</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-white shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <div className="p-3 rounded-full bg-emerald-100 text-emerald-600 mb-3">
                    <ClipboardCheck className="h-8 w-8" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{recentReports.length}</div>
                  <p className="text-sm text-slate-600 mt-1">Recent Reports</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg font-medium">BHR Performance</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-slate-700">Active vs Total BHRs</p>
                      <p className="text-sm text-slate-600 font-medium">{activeBHRs} / {totalBHRs}</p>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ 
                          width: totalBHRs > 0 ? `${(activeBHRs / totalBHRs) * 100}%` : '0%'
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {totalBHRs > 0 ? Math.round((activeBHRs / totalBHRs) * 100) : 0}% active participation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-lg font-medium">Visit Distribution by Branch Category</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {categoryData.length > 0 ? (
                  <div className="h-[220px] w-full">
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
                            label={({name, value}) => `${name} (${value})`}
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
                                  <div className="bg-white p-3 border rounded shadow-md">
                                    <p className="font-medium">{data.name}: {data.value} visits</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                      {((data.value / categoryData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}% of total visits
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend 
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                            formatter={(value, entry, index) => (
                              <span className="text-sm font-medium text-slate-700">{value}</span>
                            )}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                ) : (
                  <div className="h-[220px] flex items-center justify-center">
                    <div className="text-center">
                      <PieChartIcon className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500">No visit data available</p>
                      <p className="text-xs text-slate-400 mt-1">Reports will appear as they're submitted</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="border-b pb-3">
              <CardTitle className="text-lg font-medium">Recent Branch Visit Reports</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {recentReports.length === 0 ? (
                <div className="text-center py-8">
                  <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-600">No reports found</p>
                  <p className="text-xs text-slate-500 mt-1">Reports will appear here as they are submitted</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="pb-3 font-medium text-slate-700">BHR</th>
                        <th className="pb-3 font-medium text-slate-700">Branch</th>
                        <th className="pb-3 font-medium text-slate-700">Visit Date</th>
                        <th className="pb-3 font-medium text-slate-700">Status</th>
                        <th className="pb-3 font-medium text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-b last:border-0 hover:bg-slate-50">
                          <td className="py-3">
                            <div className="font-medium text-slate-800">{report.profiles?.full_name || "Unknown"}</div>
                            <div className="text-xs text-slate-500">{report.profiles?.e_code}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-800">{report.branches?.name || "Unknown"}</div>
                            <div className="text-xs text-slate-500">{report.branches?.location}</div>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-slate-700">{formatDate(report.visit_date)}</div>
                          </td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getStatusClass(report.status)}`}>
                              {report.status?.charAt(0).toUpperCase() + report.status?.slice(1)}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewReport(report.id)}
                              className="hover:bg-slate-100"
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
            <CardFooter className="border-t pt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto hover:bg-slate-100"
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
        visit={selectedVisit} 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVisit(null);
        }}
      />
    </div>
  );
};

export default ZHDashboard;
