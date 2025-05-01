import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid } from "date-fns";
import { Search, CalendarIcon, Check, X, Filter, Calendar as CalendarIcon2 } from "lucide-react";
import { BranchVisitReport, fetchRecentReports, fetchReportById, fetchReportsByDateRange, updateReportStatus } from "@/services/reportService";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

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
          <DialogTitle className="text-xl font-bold">Branch Visit Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
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
              <div className="p-3 bg-slate-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">HR Connect Session</h4>
                <p className="font-medium">{report.hr_connect_session ? "Conducted" : "Not Conducted"}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Manning Percentage</h4>
                <p className="font-medium">{report.manning_percentage}%</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-md">
                <h4 className="text-sm font-medium text-gray-500">Attrition Percentage</h4>
                <p className="font-medium">{report.attrition_percentage}%</p>
              </div>
              {report.status && (
                <div className="p-3 bg-slate-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <div className="mt-1">{getStatusBadge(report.status)}</div>
                </div>
              )}
            </div>
          </div>

          {report.feedback && (
            <div>
              <h3 className="font-medium text-lg border-b pb-2">Feedback</h3>
              <div className="mt-2 p-4 bg-slate-50 rounded-md">
                <p>{report.feedback}</p>
              </div>
            </div>
          )}

          {report.status === "submitted" && (
            <div className="sticky bottom-0 py-4 bg-white border-t mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => onStatusUpdate(report.id, "rejected")}
              >
                <X className="mr-2 h-4 w-4" />
                Reject Report
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onStatusUpdate(report.id, "approved")}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve Report
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const DateRangePicker = ({ onDateRangeChange }: { onDateRangeChange: (range: DateRange) => void }) => {
  const [date, setDate] = useState<DateRange>({
    from: undefined,
    to: undefined
  });
  
  useEffect(() => {
    // Only trigger the callback if we have a complete range or no dates at all
    if ((date.from === undefined && date.to === undefined) || 
        (date.from !== undefined && date.to !== undefined)) {
      onDateRangeChange(date);
    }
  }, [date, onDateRangeChange]);

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full md:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, yyyy")} - {format(date.to, "LLL dd, yyyy")}
                </>
              ) : (
                format(date.from, "LLL dd, yyyy")
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
            defaultMonth={date.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            className="p-3 pointer-events-auto"
          />
          <div className="p-3 border-t border-border flex justify-between">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setDate({ from: undefined, to: undefined });
              }}
            >
              Clear
            </Button>
            <Button 
              size="sm"
              onClick={() => {
                if (date.from && !date.to) {
                  setDate(prev => ({ from: prev.from, to: prev.from }));
                }
              }}
              disabled={!date.from || !!date.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const ZHReviewReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined
  });

  const { data: reports = [], isLoading, refetch } = useQuery({
    queryKey: ['zh-all-reports', dateRange],
    queryFn: () => dateRange.from || dateRange.to 
      ? fetchReportsByDateRange(dateRange.from, dateRange.to, 100)
      : fetchRecentReports(100)
  });

  const handleStatusUpdate = async (reportId: string, status: "approved" | "rejected") => {
    await updateReportStatus(reportId, status);
    refetch();
    setSelectedReportId(null);
  };

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
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

      <Card className="mb-6 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  placeholder="Search by branch name or BHR name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex items-center">
                    <Filter className="h-4 w-4 mr-2 text-slate-400" />
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
            
            <div>
              <DateRangePicker onDateRangeChange={handleDateRangeChange} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <span className="sr-only">Loading...</span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="flex justify-center mb-3">
                <CalendarIcon2 className="h-12 w-12 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium mb-1">No reports found</h3>
              <p>No branch visit reports match your current filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-medium">Branch</TableHead>
                  <TableHead className="font-medium">BHR Name</TableHead>
                  <TableHead className="font-medium">Visit Date</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">{report.branch_name}</TableCell>
                    <TableCell>{report.bh_name}</TableCell>
                    <TableCell>{formatDate(report.visit_date)}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReportId(report.id)}
                        className={`
                          bg-slate-100 hover:bg-slate-200 text-slate-700 
                          ${report.status === "submitted" ? "border-blue-200 hover:border-blue-300" : ""}
                        `}
                      >
                        {report.status === "submitted" ? "Review" : "View Details"}
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
