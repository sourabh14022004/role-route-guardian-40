import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getBranchVisitsByRole } from "@/services/reportService";
import { ClipboardCheck } from "lucide-react";

const ZHReviewReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingReports, setProcessingReports] = useState<string[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const data = await getBranchVisitsByRole(user.id, "zh");
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load reports.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status: string) => {
    switch (status) {
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

  const handleApprove = async (reportId: string) => {
    try {
      // Add loading state for this specific report
      setProcessingReports(prev => [...prev, reportId]);
      
      const { data, error } = await supabase
        .from("branch_visits")
        .update({ status: "approved" })
        .eq("id", reportId)
        .select();
      
      if (error) throw error;
      
      // Update the report in the UI
      setReports(prevReports => prevReports.map(report => 
        report.id === reportId ? { ...report, status: "approved" } : report
      ));
      
      toast({
        title: "Report approved",
        description: "The branch visit report has been approved."
      });
    } catch (error) {
      console.error("Error approving report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve report."
      });
    } finally {
      // Remove loading state for this report
      setProcessingReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const handleReject = async (reportId: string) => {
    try {
      // Add loading state for this specific report
      setProcessingReports(prev => [...prev, reportId]);
      
      const { data, error } = await supabase
        .from("branch_visits")
        .update({ status: "rejected" })
        .eq("id", reportId)
        .select();
      
      if (error) throw error;
      
      // Update the report in the UI
      setReports(prevReports => prevReports.map(report => 
        report.id === reportId ? { ...report, status: "rejected" } : report
      ));
      
      toast({
        title: "Report rejected",
        description: "The branch visit report has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting report:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject report."
      });
    } finally {
      // Remove loading state for this report
      setProcessingReports(prev => prev.filter(id => id !== reportId));
    }
  };

  const filteredReports = reports.filter((report) => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      report.branch_name?.toLowerCase().includes(searchTerm) ||
      report.branch_location?.toLowerCase().includes(searchTerm) ||
      report.bhr_name?.toLowerCase().includes(searchTerm) ||
      report.status?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Review Branch Visit Reports
        </h1>
        <p className="text-lg text-slate-600">
          Approve or reject branch visit reports submitted by BHRs.
        </p>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-lg font-medium">
            Branch Visit Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600">No reports found</p>
              <p className="text-xs text-slate-500 mt-1">
                Reports will appear here as they are submitted
              </p>
            </div>
          ) : (
            <ScrollArea>
              <Table>
                <TableCaption>
                  A list of all branch visit reports.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px]">Branch</TableHead>
                    <TableHead>BHR</TableHead>
                    <TableHead>Visit Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        <div className="font-medium text-slate-800">
                          {report.branch_name || "Unknown"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {report.branch_location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">
                          {report.bhr_name || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(report.visit_date)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusClass(report.status)}>
                          {report.status?.charAt(0).toUpperCase() +
                            report.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleApprove(report.id)}
                          disabled={
                            report.status === "approved" ||
                            processingReports.includes(report.id)
                          }
                          className="mr-2"
                        >
                          {processingReports.includes(report.id)
                            ? "Approving..."
                            : "Approve"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(report.id)}
                          disabled={
                            report.status === "rejected" ||
                            processingReports.includes(report.id)
                          }
                        >
                          {processingReports.includes(report.id)
                            ? "Rejecting..."
                            : "Reject"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            className="ml-auto hover:bg-slate-100"
            onClick={() => navigate("/zh/dashboard")}
          >
            Back to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ZHReviewReports;
