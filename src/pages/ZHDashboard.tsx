
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "@/services/zhService";
import { fetchRecentReports } from "@/services/reportService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";

interface ReportDetailsModalProps {
  visitId: string | null;
  open: boolean;
  onClose: () => void;
}

const ReportDetailsModal = ({ visitId, open, onClose }: ReportDetailsModalProps) => {
  const { data: visit, isLoading } = useQuery({
    queryKey: ['visit-report', visitId],
    queryFn: async () => {
      if (!visitId) return null;
      
      const { data, error } = await supabase
        .from('branch_visits')
        .select(`
          id,
          visit_date,
          branches:branch_id(name, location, category),
          profiles:user_id(full_name, e_code),
          feedback,
          hr_connect_session,
          manning_percentage,
          attrition_percentage,
          recruitment_required,
          er_issues,
          compliance_issues,
          infrastructure_issues,
          action_items,
          status
        `)
        .eq('id', visitId)
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      const branchName = data.branches && typeof data.branches === 'object' 
        ? (data.branches as any).name || 'Unknown Branch'
        : 'Unknown Branch';
        
      const branchLocation = data.branches && typeof data.branches === 'object' 
        ? (data.branches as any).location || 'Unknown Location'
        : 'Unknown Location';
        
      const branchCategory = data.branches && typeof data.branches === 'object' 
        ? (data.branches as any).category || 'Unknown Category'
        : 'Unknown Category';
        
      const bhName = data.profiles && typeof data.profiles === 'object'
        ? (data.profiles as any).full_name || 'Unknown BH'
        : 'Unknown BH';
      
      const bhCode = data.profiles && typeof data.profiles === 'object'
        ? (data.profiles as any).e_code || 'N/A'
        : 'N/A';
      
      return {
        id: data.id,
        branch: {
          name: branchName,
          location: branchLocation,
          category: branchCategory
        },
        bh_name: bhName,
        bh_code: bhCode,
        visit_date: data.visit_date ? new Date(data.visit_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }) : 'Unknown Date',
        report_details: {
          feedback: data.feedback || 'No feedback provided',
          manning_percentage: Number(data.manning_percentage || 0),
          attrition_percentage: Number(data.attrition_percentage || 0),
          hr_connect_session: Boolean(data.hr_connect_session || false),
          recruitment_required: Boolean(data.recruitment_required || false),
          er_issues: data.er_issues || 'None reported',
          compliance_issues: data.compliance_issues || 'None reported',
          infrastructure_issues: data.infrastructure_issues || 'None reported',
          action_items: data.action_items || 'No action items'
        },
        status: data.status
      };
    },
    enabled: !!visitId && open
  });

  if (!open) return null;

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading report details...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Branch Visit Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Branch</p>
              <p className="text-lg font-medium">{visit.branch.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Location</p>
              <p className="text-lg font-medium">{visit.branch.location}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Category</p>
              <p className="text-lg font-medium capitalize">{visit.branch.category}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Visit Date</p>
              <p className="text-lg font-medium">{visit.visit_date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">BHR Name</p>
              <p className="text-lg font-medium">{visit.bh_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Employee Code</p>
              <p className="text-lg font-medium">{visit.bh_code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">HR Connect Session</p>
              <p className="text-lg font-medium">{visit.report_details.hr_connect_session ? "Conducted" : "Not Conducted"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Recruitment Required</p>
              <p className="text-lg font-medium">{visit.report_details.recruitment_required ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Manning Percentage</p>
              <p className="text-lg font-medium">{visit.report_details.manning_percentage}%</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Attrition Percentage</p>
              <p className="text-lg font-medium">{visit.report_details.attrition_percentage}%</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">ER Issues</p>
            <p className="text-base p-3 bg-slate-50 rounded-md">{visit.report_details.er_issues}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Compliance Issues</p>
            <p className="text-base p-3 bg-slate-50 rounded-md">{visit.report_details.compliance_issues}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Infrastructure Issues</p>
            <p className="text-base p-3 bg-slate-50 rounded-md">{visit.report_details.infrastructure_issues}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Action Items</p>
            <p className="text-base p-3 bg-slate-50 rounded-md">{visit.report_details.action_items}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Feedback</p>
            <p className="text-base p-3 bg-slate-50 rounded-md">{visit.report_details.feedback}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ErrorFallback component for empty states
const ErrorFallback = ({ message }: { message: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <AlertCircle className="h-10 w-10 text-slate-300 mb-2" />
      <p className="text-slate-500 text-sm">{message}</p>
    </div>
  );
};

const ZHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedVisit, setSelectedVisit] = useState<string | null>(null);
  const [selectedBhId, setSelectedBhId] = useState<string | null>(null);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['zh-dashboard-stats'],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchDashboardStats(user.id);
    },
    enabled: !!user?.id
  });

  // Fetch branch visit reports from service
  const { data: visitReports, isLoading: visitsLoading } = useQuery({
    queryKey: ['zh-recent-visits'],
    queryFn: async () => {
      const reports = await fetchRecentReports(5);
      
      // Format the date for display
      return reports.map(report => ({
        ...report,
        visit_date: new Date(report.visit_date).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        })
      }));
    }
  });

  // Fetch BHR report counts
  const { data: bhrReportCounts, isLoading: bhrCountsLoading } = useQuery({
    queryKey: ['bhr-report-counts'],
    queryFn: async () => {
      try {
        // Get report counts per BHR
        const { data, error } = await supabase
          .from('branch_visits')
          .select(`
            user_id,
            profiles:user_id(full_name)
          `)
          .eq('status', 'submitted');
        
        if (error) throw error;
        
        // Count reports by BHR - with safety checks
        const bhrCounts: Record<string, { id: string, name: string, reports: number }> = {};
        
        (data || []).forEach(visit => {
          if (!visit.user_id) return;
          
          const userId = visit.user_id;
          
          // Extract BH name safely
          let name = 'Unknown';
          if (visit.profiles && typeof visit.profiles === 'object' && visit.profiles !== null) {
            const profileObj = visit.profiles as { full_name?: string };
            if (profileObj && typeof profileObj.full_name === 'string') {
              name = profileObj.full_name;
            }
          }
          
          if (!bhrCounts[userId]) {
            bhrCounts[userId] = { id: userId, name, reports: 0 };
          }
          bhrCounts[userId].reports++;
        });
        
        return Object.values(bhrCounts);
      } catch (error: any) {
        console.error("Error loading BHR report counts:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load BHR report counts: ${error.message}`,
        });
        return [];
      }
    }
  });

  const handleViewAllReports = () => {
    navigate('/zh/review-reports');
  };
  
  const handleViewAllBHRs = () => {
    navigate('/zh/bhr-management');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, Zonal HR User</h1>
        <p className="text-slate-600 mt-1">Manage branch assignments and monitor BHR performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total BHRs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">{statsLoading ? "..." : stats?.totalBHRs}</p>
              <div className="ml-auto bg-blue-50 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active BHRs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">{statsLoading ? "..." : stats?.totalBHRs}</p>
              <div className="ml-auto bg-green-50 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <p className="text-3xl font-bold">{statsLoading ? "..." : stats?.totalBranches}</p>
              <div className="ml-auto bg-purple-50 p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-500"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/><path d="M12 3v6"/></svg>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Recent Branch Visit Reports */}
        <div className="lg:col-span-2">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Branch Visit Reports</CardTitle>
                <Button variant="ghost" size="sm" onClick={handleViewAllReports} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                  View All <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {visitsLoading ? (
                <p className="text-center py-4 text-slate-500">Loading reports...</p>
              ) : !visitReports || visitReports.length === 0 ? (
                <ErrorFallback message="No reports found" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-medium">Branch</TableHead>
                      <TableHead className="font-medium">BH Assigned</TableHead>
                      <TableHead className="font-medium">Last Report</TableHead>
                      <TableHead className="font-medium">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitReports.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>{visit.branch_name}</TableCell>
                        <TableCell>{visit.bh_name}</TableCell>
                        <TableCell>{visit.visit_date}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedVisit(visit.id)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1"
                          >
                            View Report
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - BHR Performance Overview */}
        <div>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle>BHR Report Submissions</CardTitle>
                <Badge variant="outline">Overall</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {bhrCountsLoading ? (
                <p className="text-center py-4 text-slate-500">Loading BHR data...</p>
              ) : !bhrReportCounts || bhrReportCounts.length === 0 ? (
                <ErrorFallback message="No BHR data found" />
              ) : (
                <div className="space-y-4">
                  {bhrReportCounts.map((bhr, index) => (
                    <div 
                      key={index} 
                      className="flex justify-between items-center cursor-pointer hover:bg-slate-50 p-3 rounded-md border border-transparent hover:border-slate-200 transition-colors"
                      onClick={() => setSelectedBhId(bhr.id)}
                    >
                      <div className="flex items-center">
                        <div className="bg-blue-100 text-blue-600 h-8 w-8 rounded-full flex items-center justify-center mr-3 font-medium">
                          {bhr.name.charAt(0)}
                        </div>
                        <p className="text-sm font-medium">{bhr.name}</p>
                      </div>
                      <Badge variant="secondary" className="bg-slate-100">{bhr.reports} reports</Badge>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="w-full hover:bg-slate-100" onClick={handleViewAllBHRs}>
                      View All BHRs
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Report Details Modal */}
      <ReportDetailsModal 
        visitId={selectedVisit} 
        open={!!selectedVisit} 
        onClose={() => setSelectedVisit(null)}
      />

      {/* BHR Details Modal */}
      <BHRDetailsModal
        bhId={selectedBhId}
        open={!!selectedBhId}
        onClose={() => setSelectedBhId(null)}
      />
    </div>
  );
};

export default ZHDashboard;
