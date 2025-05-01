
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, MapPin, User, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchBHRReportStats } from "@/services/reportService";

interface Branch {
  id: string;
  name: string;
  location: string;
  category: string;
}

interface BHRDetailsModalProps {
  bhId: string | null;
  open: boolean;
  onClose: () => void;
}

const BHRDetailsModal = ({ bhId, open, onClose }: BHRDetailsModalProps) => {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: bhrProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['bhr-profile', bhId],
    queryFn: async () => {
      if (!bhId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', bhId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!bhId && open
  });

  const { data: assignedBranches, isLoading: branchesLoading } = useQuery({
    queryKey: ['bhr-branches', bhId],
    queryFn: async () => {
      if (!bhId) return [];
      
      const { data, error } = await supabase
        .from('branch_assignments')
        .select(`
          branch_id,
          branches:branch_id (
            id,
            name,
            location,
            category
          )
        `)
        .eq('user_id', bhId);
      
      if (error) throw error;
      
      // Transform data to ensure it's an array of Branch objects
      return (data || []).map(item => {
        // Safely extract branch data
        if (!item.branches) return null;
        
        // Handle the branches object
        const branch = item.branches as unknown as Branch;
        return {
          id: branch.id,
          name: branch.name,
          location: branch.location,
          category: branch.category
        };
      }).filter(Boolean) as Branch[];
    },
    enabled: !!bhId && open
  });

  const { data: reportStats } = useQuery({
    queryKey: ['bhr-report-stats', bhId],
    queryFn: async () => {
      if (!bhId) return null;
      return fetchBHRReportStats(bhId);
    },
    enabled: !!bhId && open
  });

  const { data: recentReports, isLoading: reportsLoading } = useQuery({
    queryKey: ['bhr-recent-reports', bhId],
    queryFn: async () => {
      if (!bhId) return [];
      
      const { data, error } = await supabase
        .from('branch_visits')
        .select(`
          id,
          visit_date,
          status,
          branches:branch_id (
            name,
            location,
            category
          )
        `)
        .eq('user_id', bhId)
        .order('visit_date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      return data || [];
    },
    enabled: !!bhId && open
  });

  // Fixed: Now properly waits for reportDetails data
  const { data: reportDetails, isLoading: reportDetailsLoading } = useQuery({
    queryKey: ['bhr-report-details', selectedReportId],
    queryFn: async () => {
      if (!selectedReportId) return null;
      
      const { data, error } = await supabase
        .from('branch_visits')
        .select('*, branches:branch_id(name, location)')
        .eq('id', selectedReportId)
        .single();
      
      if (error) {
        console.error("Error fetching report details:", error);
        throw error;
      }
      return data;
    },
    enabled: !!selectedReportId
  });

  const getStatusBadge = (status: string | null) => {
    switch(status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch(category.toLowerCase()) {
      case "platinum":
        return <Badge className="bg-violet-100 text-violet-800">Platinum</Badge>;
      case "diamond":
        return <Badge className="bg-blue-100 text-blue-800">Diamond</Badge>;
      case "gold":
        return <Badge className="bg-amber-100 text-amber-800">Gold</Badge>;
      case "silver":
        return <Badge className="bg-slate-200 text-slate-800">Silver</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800">Bronze</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">BHR Details</DialogTitle>
        </DialogHeader>

        {profileLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !bhrProfile ? (
          <div className="py-4 text-center text-slate-500">BHR profile not found</div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4 md:items-start mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                {bhrProfile.full_name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{bhrProfile.full_name}</h3>
                <p className="text-slate-500">{bhrProfile.e_code}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="flex items-center">
                    <User className="h-5 w-5 text-slate-400 mr-2" />
                    <span>{bhrProfile.role}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-slate-400 mr-2" />
                    <span>{bhrProfile.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-slate-400 mr-2" />
                    <span>Joined {formatDate(bhrProfile.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 mb-6">
              <Card className="bg-slate-50 border-slate-200 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-slate-500">Total Reports</p>
                  <p className="text-2xl font-bold">{reportStats?.total || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50 border-green-100 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-green-700">Approved</p>
                  <p className="text-2xl font-bold">{reportStats?.approved || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 border-blue-100 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-blue-700">Pending</p>
                  <p className="text-2xl font-bold">{reportStats?.pending || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-red-50 border-red-100 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-red-700">Rejected</p>
                  <p className="text-2xl font-bold">{reportStats?.rejected || 0}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="branches" className="mt-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="branches">Assigned Branches</TabsTrigger>
                <TabsTrigger value="reports">Reports</TabsTrigger>
              </TabsList>
              <TabsContent value="branches" className="max-h-[300px] overflow-y-auto bg-white rounded-md shadow-sm border">
                {branchesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !assignedBranches || assignedBranches.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">No branches assigned</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Category</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedBranches.map((branch) => (
                        <TableRow key={branch.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{branch.name}</TableCell>
                          <TableCell>{branch.location}</TableCell>
                          <TableCell>{getCategoryBadge(branch.category)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="reports" className="max-h-[300px] overflow-y-auto bg-white rounded-md shadow-sm border">
                {reportsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : !recentReports || recentReports.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">No reports submitted</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch</TableHead>
                        <TableHead>Visit Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentReports.map(report => (
                        <TableRow key={report.id} className="hover:bg-slate-50">
                          <TableCell className="font-medium">{report.branches && typeof report.branches === 'object' ? 
                            (report.branches as any).name : 'Unknown'}</TableCell>
                          <TableCell>{formatDate(report.visit_date)}</TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="hover:bg-slate-200"
                              onClick={() => setSelectedReportId(report.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>

            {/* Report Details Dialog */}
            {selectedReportId && (
              <Dialog open={!!selectedReportId} onOpenChange={(open) => !open && setSelectedReportId(null)}>
                <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                      <span>Branch Visit Report</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full"
                        onClick={() => setSelectedReportId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </DialogTitle>
                  </DialogHeader>
                  
                  {reportDetailsLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                  ) : !reportDetails ? (
                    <div className="py-4 text-center text-slate-500">Report not found</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-md">
                        <div>
                          <p className="text-sm font-medium text-slate-500">Branch</p>
                          <p className="font-medium">{reportDetails.branches ? reportDetails.branches.name : 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Location</p>
                          <p className="font-medium">{reportDetails.branches ? reportDetails.branches.location : 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Visit Date</p>
                          <p className="font-medium">{formatDate(reportDetails.visit_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Status</p>
                          <div className="mt-1">{getStatusBadge(reportDetails.status)}</div>
                        </div>
                      </div>

                      <Card className="bg-white shadow-sm">
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Manning Percentage</p>
                            <p className="font-medium">{reportDetails.manning_percentage}%</p>
                          </div>
  
                          <div>
                            <p className="text-sm font-medium text-slate-500">Attrition Percentage</p>
                            <p className="font-medium">{reportDetails.attrition_percentage}%</p>
                          </div>
  
                          <div>
                            <p className="text-sm font-medium text-slate-500">HR Connect Session</p>
                            <p className="font-medium">{reportDetails.hr_connect_session ? "Conducted" : "Not Conducted"}</p>
                          </div>
                        </CardContent>
                      </Card>

                      {reportDetails.feedback && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-slate-500">Feedback</p>
                          <div className="bg-slate-50 p-4 rounded-md shadow-sm">
                            <p>{reportDetails.feedback}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BHRDetailsModal;
