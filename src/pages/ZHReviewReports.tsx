
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Calendar as CalendarIcon,
  FileCheck,
  Check,
  X,
  Eye,
  Filter,
  BarChart,
  Calendar as CalIcon,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BranchVisitDetailsModal from "@/components/branch/BranchVisitDetailsModal";

const ZHReviewReports = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  
  // Date range state with proper typing
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Fetch reports with filters
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["zh-reports", currentPage, statusFilter, categoryFilter, dateRange, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("branch_visits")
        .select(`
          *,
          branches:branch_id(*),
          profiles:user_id(*)
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      if (categoryFilter) {
        query = query.eq('branch_category', categoryFilter);
      }
      
      if (dateRange?.from) {
        const formattedFrom = format(dateRange.from, 'yyyy-MM-dd');
        query = query.gte('visit_date', formattedFrom);
      }
      
      if (dateRange?.to) {
        const formattedTo = format(dateRange.to, 'yyyy-MM-dd');
        query = query.lte('visit_date', formattedTo);
      }
      
      if (searchQuery) {
        query = query.or(`branches.name.ilike.%${searchQuery}%,profiles.full_name.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
  });
  
  // Handle report actions
  const handleReportAction = async (reportId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('branch_visits')
        .update({ status })
        .eq('id', reportId);
      
      if (error) throw error;
      
      toast({
        title: `Report ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
        description: `The branch visit report has been ${status}.`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update report status: ${error.message}`,
      });
    }
  };
  
  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Review Branch Visit Reports</h1>
          <p className="text-slate-500">Approve or reject reports submitted by BHRs</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalIcon className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={(range) => setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input 
                placeholder="Search branch or BHR..." 
                className="pl-9" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>BHR</TableHead>
                <TableHead className="hidden md:table-cell">Visit Date</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : reports?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No reports found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                reports?.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.branches.name}</TableCell>
                    <TableCell>{report.profiles.full_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(report.visit_date)}</TableCell>
                    <TableCell className="hidden md:table-cell capitalize">{report.branch_category}</TableCell>
                    <TableCell>
                      <div className={cn(
                        "px-2 py-1 text-xs rounded-full w-fit flex items-center",
                        report.status === "approved" ? "bg-green-100 text-green-800" :
                        report.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-blue-100 text-blue-800"
                      )}>
                        {report.status === "approved" && <Check className="mr-1 h-3 w-3" />}
                        {report.status === "rejected" && <X className="mr-1 h-3 w-3" />}
                        {report.status === "submitted" && <FileCheck className="mr-1 h-3 w-3" />}
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewReport(report)}
                          className="h-8 w-8 p-0"
                        >
                          <span className="sr-only">View</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {report.status === "submitted" && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReportAction(report.id, 'approved')}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            >
                              <span className="sr-only">Approve</span>
                              <Check className="h-4 w-4" />
                            </Button>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReportAction(report.id, 'rejected')}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <span className="sr-only">Reject</span>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4">
          <div className="text-sm text-slate-500">
            Showing {Math.min(reports?.length || 0, 10)} of {reports?.length || 0} reports
          </div>
          
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" onClick={() => setCurrentPage(prev => prev + 1)} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardFooter>
      </Card>
      
      <BranchVisitDetailsModal 
        visit={selectedReport} 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </div>
  );
};

export default ZHReviewReports;
