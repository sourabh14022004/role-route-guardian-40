
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchZHDashboardStats } from "@/services/reportService";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Users,
  FileText,
  Building,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";

const ZHDashboard = () => {
  const [reportDetailsModalOpen, setReportDetailsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Fetch dashboard statistics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ["zh-dashboard-stats"],
    queryFn: fetchZHDashboardStats,
  });
  
  // Fetch recent reports
  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["recent-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_visits")
        .select(`
          id,
          visit_date,
          status,
          created_at,
          profiles:user_id(full_name, e_code),
          branches:branch_id(name, location)
        `)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Fetch branch categories distribution
  const { data: branchCategories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["branch-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select("category");
        
      if (error) throw error;
      
      const categories: Record<string, number> = {};
      data?.forEach(branch => {
        const category = branch.category;
        categories[category] = (categories[category] || 0) + 1;
      });
      
      return Object.entries(categories).map(([category, count]) => ({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: count,
      }));
    },
  });
  
  const handleViewReport = async (reportId: string) => {
    try {
      const { data, error } = await supabase
        .from("branch_visits")
        .select("*, branches:branch_id(*)")
        .eq("id", reportId)
        .single();
        
      if (error) throw error;
      
      setSelectedReport(data);
      setReportDetailsModalOpen(true);
    } catch (error) {
      console.error("Error fetching report details:", error);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "submitted": return "bg-blue-100 text-blue-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Zone Head Dashboard</h1>
      
      {/* Dashboard summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total BHRs</p>
                <div className="flex items-baseline gap-2">
                  {statsLoading ? (
                    <div className="h-5 w-12 bg-slate-100 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-2xl font-bold">{dashboardStats?.bhrs.total}</h3>
                  )}
                </div>
              </div>
              <div className="h-9 w-9 bg-blue-100 flex items-center justify-center rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            {statsLoading ? (
              <div className="h-4 w-16 bg-slate-100 animate-pulse rounded mt-3" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-blue-600">{dashboardStats?.bhrs.active}</span> active this month
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                <div className="flex items-baseline gap-2">
                  {statsLoading ? (
                    <div className="h-5 w-12 bg-slate-100 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-2xl font-bold">{dashboardStats?.reports.total}</h3>
                  )}
                </div>
              </div>
              <div className="h-9 w-9 bg-green-100 flex items-center justify-center rounded-lg">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
            </div>
            {statsLoading ? (
              <div className="h-4 w-16 bg-slate-100 animate-pulse rounded mt-3" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-green-600">{dashboardStats?.reports.pending}</span> pending review
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Branches</p>
                <div className="flex items-baseline gap-2">
                  {statsLoading ? (
                    <div className="h-5 w-12 bg-slate-100 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-2xl font-bold">{dashboardStats?.branches.total}</h3>
                  )}
                </div>
              </div>
              <div className="h-9 w-9 bg-orange-100 flex items-center justify-center rounded-lg">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            {statsLoading ? (
              <div className="h-4 w-16 bg-slate-100 animate-pulse rounded mt-3" />
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-medium text-orange-600">{dashboardStats?.branches.mapped}</span> mapped to BHRs
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Reports</p>
                <div className="flex items-baseline gap-2">
                  {statsLoading ? (
                    <div className="h-5 w-12 bg-slate-100 animate-pulse rounded" />
                  ) : (
                    <h3 className="text-2xl font-bold">{dashboardStats?.reports.monthly}</h3>
                  )}
                </div>
              </div>
              <div className="h-9 w-9 bg-purple-100 flex items-center justify-center rounded-lg">
                <BarChart className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            {statsLoading ? (
              <div className="h-4 w-16 bg-slate-100 animate-pulse rounded mt-3" />
            ) : (
              <div className="mt-3 pt-3 border-t">
                <Progress value={(dashboardStats?.bhrs.active || 0) / (dashboardStats?.bhrs.total || 1) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((dashboardStats?.bhrs.active || 0) / (dashboardStats?.bhrs.total || 1) * 100)}% BHR participation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Recent reports section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Latest branch visit reports from BHRs</CardDescription>
          </CardHeader>
          <CardContent>
            {reportsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recentReports?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No reports submitted yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentReports?.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <h4 className="font-medium">{report.branches?.name}</h4>
                        <span className="text-sm text-slate-500">{report.branches?.location}</span>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 mt-1">
                        <span className="text-sm">{report.profiles?.full_name}</span>
                        <span className="text-xs text-slate-500">{formatDate(report.visit_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewReport(report.id)}
                        className="flex items-center gap-1 hover:bg-slate-200"
                      >
                        View
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              asChild
            >
              <a href="/zh/review-reports">View All Reports</a>
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Branch Categories</CardTitle>
            <CardDescription>Distribution of branches by category</CardDescription>
          </CardHeader>
          <CardContent>
            {categoriesLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {branchCategories?.map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-sm text-slate-500">{category.value}</span>
                    </div>
                    <Progress 
                      value={category.value / (branchCategories.reduce((acc, cat) => acc + cat.value, 0) || 1) * 100} 
                      className={`h-2 ${
                        category.name === 'Platinum' ? 'bg-violet-200 [&>div]:bg-violet-500' : 
                        category.name === 'Diamond' ? 'bg-blue-200 [&>div]:bg-blue-500' :
                        category.name === 'Gold' ? 'bg-amber-200 [&>div]:bg-amber-500' :
                        category.name === 'Silver' ? 'bg-slate-200 [&>div]:bg-slate-500' :
                        'bg-orange-200 [&>div]:bg-orange-500'
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-4" 
              asChild
            >
              <a href="/zh/branch-mapping">Manage Branch Mapping</a>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <BranchVisitDetailsModal
        visit={selectedReport}
        isOpen={reportDetailsModalOpen}
        onClose={() => {
          setReportDetailsModalOpen(false);
          setSelectedReport(null);
        }}
      />
    </div>
  );
};

export default ZHDashboard;
