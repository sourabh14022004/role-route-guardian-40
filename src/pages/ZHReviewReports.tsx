
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, CalendarIcon } from "lucide-react";
import { BranchVisitReport, fetchRecentReports, fetchReportById, updateReportStatus } from "@/services/reportService";

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

interface ReportDetailsModalProps {
  reportId: string | null;
  open: boolean;
  onClose: () => void;
  onStatusUpdate: (reportId: string, status: "approved" | "rejected") => void;
}

const ReportDetailsModal = ({ reportId, open, onClose, onStatusUpdate }: ReportDetailsModalProps) => {
  const { data: report, isLoading } = useQuery({
    queryKey: ['report-details', reportId],
    queryFn: () => reportId ? fetchReportById(reportId) : null,
    enabled: !!reportId && open
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Loading report details...</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!report) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Branch Visit Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Branch</h3>
              <p className="text-lg font-medium">{report.branch_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Location</h3>
              <p className="text-lg font-medium">{report.branch_location}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p className="text-lg font-medium capitalize">{report.branch_category}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Visit Date</h3>
              <p className="text-lg font-medium">{formatDate(report.visit_date)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">BHR Name</h3>
              <p className="text-lg font-medium">{report.bh_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Employee Code</h3>
              <p className="text-lg font-medium">{report.bh_code}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-lg border-b pb-2">Visit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">HR Connect Session</h4>
                <p className="font-medium">{report.hr_connect_session ? "Conducted" : "Not Conducted"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Manning Percentage</h4>
                <p className="font-medium">{report.manning_percentage}%</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Attrition Percentage</h4>
                <p className="font-medium">{report.attrition_percentage}%</p>
              </div>
              {report.status && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="mt-1">{getStatusBadge(report.status)}</div>
                </div>
              )}
            </div>
          </div>

          {report.feedback && (
            <div>
              <h3 className="font-medium text-lg border-b pb-2">Feedback</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p>{report.feedback}</p>
              </div>
            </div>
          )}

          {report.status === "submitted" && (
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => onStatusUpdate(report.id, "rejected")}
              >
                Reject Report
              </Button>
              <Button
                onClick={() => onStatusUpdate(report.id, "approved")}
              >
                Approve Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ZHReviewReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['zh-all-reports'],
    queryFn: () => fetchRecentReports(100) // Fetch more reports for this page
  });

  const handleStatusUpdate = async (reportId: string, status: "approved" | "rejected") => {
    await updateReportStatus(reportId, status);
    refetch();
    setSelectedReportId(null);
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch = 
      (report.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      report.bh_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = 
      statusFilter === "all" || 
      report.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Review Branch Visit Reports</h1>
        <p className="text-slate-600 mt-1">
          Manage and review branch visit reports submitted by BHRs
        </p>
      </div>

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by branch name or BHR name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="sr-only">Loading...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex justify-center mb-3">
                <CalendarIcon className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium mb-1">No reports found</h3>
              <p>No branch visit reports match your current filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>BHR Name</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.branch_name}</TableCell>
                    <TableCell>{report.bh_name}</TableCell>
                    <TableCell>{formatDate(report.visit_date)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedReportId(report.id)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReportDetailsModal
        reportId={selectedReportId}
        open={!!selectedReportId}
        onClose={() => setSelectedReportId(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default ZHReviewReports;
