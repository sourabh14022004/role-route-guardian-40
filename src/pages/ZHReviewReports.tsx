
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isWithinInterval, parse, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Search, Calendar as CalendarIcon, CheckCircle, XCircle, Eye } from "lucide-react";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";
import { cn } from "@/lib/utils";

const ZHReviewReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected" | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["branch-visits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_visits")
        .select(`
          *,
          branches:branch_id (*),
          profiles:user_id (
            full_name,
            e_code
          )
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Mutation to update report status
  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ reportId, status, comment }: { reportId: string, status: string, comment: string }) => {
      const { error } = await supabase
        .from("branch_visits")
        .update({ 
          status, 
          review_comment: comment,
          reviewed_at: new Date().toISOString() 
        })
        .eq("id", reportId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-visits"] });
      toast({
        title: "Report updated",
        description: "Report status has been successfully updated",
      });
      setReviewDialogOpen(false);
      setReviewStatus(null);
      setReviewComment("");
    },
    onError: (error) => {
      console.error("Error updating report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update report status. Please try again.",
      });
    },
  });
  
  // Filter reports based on search, status, and date range
  const filteredReports = reports?.filter(report => {
    const searchMatches = !searchQuery || (
      (report.branches?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (report.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    const statusMatches = !statusFilter || report.status === statusFilter;
    
    let dateMatches = true;
    if (dateRange.from && dateRange.to) {
      const visitDate = new Date(report.visit_date);
      dateMatches = isWithinInterval(visitDate, {
        start: startOfDay(dateRange.from),
        end: endOfDay(dateRange.to)
      });
    }
    
    return searchMatches && statusMatches && dateMatches;
  }) || [];
  
  // Handle view report details
  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setReportDetailsOpen(true);
  };
  
  // Handle open review dialog
  const handleOpenReviewDialog = (report: any) => {
    setSelectedReport(report);
    setReviewDialogOpen(true);
  };
  
  // Handle review submission
  const handleSubmitReview = () => {
    if (!selectedReport || !reviewStatus) return;
    
    updateReportStatusMutation.mutate({
      reportId: selectedReport.id,
      status: reviewStatus,
      comment: reviewComment
    });
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd MMM yyyy");
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-800">Draft</Badge>;
    }
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Review Reports</h1>
          <p className="text-slate-500">Review and approve branch visit reports</p>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              placeholder="Search by branch or BHR..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter || ""} onValueChange={value => setStatusFilter(value || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "PPP")} - {format(dateRange.to, "PPP")}
                      </>
                    ) : (
                      format(dateRange.from, "PPP")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
      
      {/* Reports table */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-slate-500">No reports found matching the criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Branch</TableHead>
                  <TableHead>BHR</TableHead>
                  <TableHead>Visit Date</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {report.branches?.name || "Unknown"}
                    </TableCell>
                    <TableCell>
                      {report.profiles?.full_name || "Unknown"}
                      <span className="text-xs text-slate-500 block">
                        {report.profiles?.e_code}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(report.visit_date)}</TableCell>
                    <TableCell>{formatDate(report.created_at)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReport(report)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        
                        {report.status === "submitted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenReviewDialog(report)}
                            className="flex items-center gap-1"
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      
      {/* Report details modal */}
      <BranchVisitDetailsModal
        visit={selectedReport}
        isOpen={reportDetailsOpen}
        onClose={() => {
          setReportDetailsOpen(false);
          setSelectedReport(null);
        }}
      />
      
      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Branch</p>
                <p className="font-medium">{selectedReport?.branches?.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">BHR</p>
                <p className="font-medium">{selectedReport?.profiles?.full_name}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Status</p>
              <div className="flex items-center gap-4">
                <Button
                  variant={reviewStatus === "approved" ? "default" : "outline"}
                  onClick={() => setReviewStatus("approved")}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  variant={reviewStatus === "rejected" ? "default" : "outline"}
                  onClick={() => setReviewStatus("rejected")}
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Comment (optional)</p>
              <Input
                placeholder="Add a comment..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitReview} 
              disabled={!reviewStatus || updateReportStatusMutation.isPending}
            >
              {updateReportStatusMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Review"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZHReviewReports;
