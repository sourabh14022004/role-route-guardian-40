import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { getUserAssignedBranches } from "@/services/branchService";
import { createBranchVisit } from "@/services/reportService";
import { Checkbox } from "@/components/ui/checkbox";

const NewVisit = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [branches, setBranches] = useState<any[]>([]);
  const [branchId, setBranchId] = useState<string>("");
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [customerTraffic, setCustomerTraffic] = useState<string>("");
  const [queueManagement, setQueueManagement] = useState<string>("");
  const [cleanliness, setCleanliness] = useState<string>("");
  const [staffEfficiency, setStaffEfficiency] = useState<string>("");
  const [serviceQuality, setServiceQuality] = useState<string>("");
  const [overallImpression, setOverallImpression] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
	const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isQueueManagementApplicable, setIsQueueManagementApplicable] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!branchId || !visitDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a branch and visit date.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = visitDate.toISOString();
      const visitData = {
        user_id: user?.id,
        branch_id: branchId,
        visit_date: formattedDate,
        customer_traffic: customerTraffic,
        queue_management: isQueueManagementApplicable ? queueManagement : "N/A",
        cleanliness: cleanliness,
        staff_efficiency: staffEfficiency,
        service_quality: serviceQuality,
        overall_impression: overallImpression,
        additional_notes: additionalNotes,
      };

      await createBranchVisit(visitData);

      toast({
        title: "Visit submitted",
        description: "Your branch visit report has been submitted for review.",
      });

      navigate("/bh/my-visits");
    } catch (error) {
      console.error("Error submitting visit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit branch visit report.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchAssignedBranches = async () => {
      try {
        setIsLoading(true);
        const data = await getUserAssignedBranches(user?.id as string);
        
        // Ensure the data matches the expected type
        const typedBranches = data.map(branch => ({
          id: branch.id as string,
          name: branch.name as string,
          location: branch.location as string,
          category: branch.category as "platinum" | "diamond" | "gold" | "silver" | "bronze",
          created_at: branch.created_at || "",
          updated_at: branch.updated_at || ""
        }));
        
        setBranches(typedBranches);
        
        // If only one branch is assigned, auto-select it
        if (typedBranches.length === 1) {
          setBranchId(typedBranches[0].id);
        }
      } catch (error) {
        console.error('Error fetching assigned branches:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assigned branches."
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchAssignedBranches();
    }
  }, [user]);

  return (
    <div className="container max-w-3xl mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>New Branch Visit Report</CardTitle>
          <CardDescription>
            Submit a new branch visit report for review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="branch">Branch</Label>
              <Select onValueChange={setBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a branch" />
                </SelectTrigger>
                <SelectContent>
                  {isLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : branches.length > 0 ? (
                    branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name} - {branch.location}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-branches" disabled>No branches assigned</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Visit Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !visitDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {visitDate ? format(visitDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={visitDate}
                    onSelect={setVisitDate}
                    disabled={(date) =>
                      date > new Date()
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="customerTraffic">Customer Traffic</Label>
              <Input
                type="text"
                id="customerTraffic"
                placeholder="Enter customer traffic details"
                value={customerTraffic}
                onChange={(e) => setCustomerTraffic(e.target.value)}
              />
            </div>
						<div>
              <Label htmlFor="queueManagement">
								<div className="flex items-center space-x-2">
									<span>Queue Management</span>
									<Checkbox
										id="queueManagementApplicable"
										checked={isQueueManagementApplicable}
										onCheckedChange={(checked) => setIsQueueManagementApplicable(!!checked)}
									/>
									<Label htmlFor="queueManagementApplicable">Applicable</Label>
								</div>
							</Label>
              <Input
                type="text"
                id="queueManagement"
                placeholder="Enter queue management details"
                value={queueManagement}
								disabled={!isQueueManagementApplicable}
                onChange={(e) => setQueueManagement(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="cleanliness">Cleanliness</Label>
              <Input
                type="text"
                id="cleanliness"
                placeholder="Enter cleanliness details"
                value={cleanliness}
                onChange={(e) => setCleanliness(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="staffEfficiency">Staff Efficiency</Label>
              <Input
                type="text"
                id="staffEfficiency"
                placeholder="Enter staff efficiency details"
                value={staffEfficiency}
                onChange={(e) => setStaffEfficiency(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="serviceQuality">Service Quality</Label>
              <Input
                type="text"
                id="serviceQuality"
                placeholder="Enter service quality details"
                value={serviceQuality}
                onChange={(e) => setServiceQuality(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="overallImpression">Overall Impression</Label>
              <Input
                type="text"
                id="overallImpression"
                placeholder="Enter overall impression details"
                value={overallImpression}
                onChange={(e) => setOverallImpression(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="additionalNotes">Additional Notes</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Enter any additional notes"
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewVisit;
