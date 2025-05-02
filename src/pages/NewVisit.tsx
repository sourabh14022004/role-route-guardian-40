
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon, Save, Send, X, Check, Frown, Meh, Smile, Star, ThumbsDown, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAssignedBranchesWithDetails, createBranchVisit } from "@/services/branchService";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Branch = Database["public"]["Tables"]["branches"]["Row"];

const formSchema = z.object({
  branchId: z.string({
    required_error: "Please select a branch",
  }),
  visitDate: z.date({
    required_error: "Please select a visit date",
  }),
  branchCategory: z.string(),
  hrConnectSession: z.boolean().default(false),
  totalEmployeesInvited: z.number().min(0).default(0),
  totalParticipants: z.number().min(0).default(0),
  manningPercentage: z.number().min(0).max(100).default(0),
  attritionPercentage: z.number().min(0).max(100).default(0),
  nonVendorPercentage: z.number().min(0).max(100).default(0),
  erPercentage: z.number().min(0).max(100).default(0),
  cwtCases: z.number().min(0).default(0),
  performanceLevel: z.string().optional(),
  newEmployeesTotal: z.number().min(0).default(0),
  newEmployeesCovered: z.number().min(0).default(0),
  starEmployeesTotal: z.number().min(0).default(0),
  starEmployeesCovered: z.number().min(0).default(0),
  cultureBranch: z.enum(["very_poor", "poor", "neutral", "good", "excellent"]).optional(),
  lineManagerBehavior: z.enum(["very_poor", "poor", "neutral", "good", "excellent"]).optional(),
  branchHygiene: z.enum(["very_poor", "poor", "neutral", "good", "excellent"]).optional(),
  overallDiscipline: z.enum(["very_poor", "poor", "neutral", "good", "excellent"]).optional(),
  feedback: z.string().max(200, {
    message: "Feedback must not be longer than 200 words",
  }).optional(),
});

const NewVisit = () => {
  const [formStep, setFormStep] = useState(0);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      visitDate: new Date(), // Set default date to today
      totalEmployeesInvited: 0,
      totalParticipants: 0,
      manningPercentage: 0,
      attritionPercentage: 0,
      nonVendorPercentage: 0,
      erPercentage: 0,
      cwtCases: 0,
      newEmployeesTotal: 0,
      newEmployeesCovered: 0,
      starEmployeesTotal: 0,
      starEmployeesCovered: 0,
    },
  });
  
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    const loadBranches = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching branches for user:", user.id);
        const assignedBranches = await fetchAssignedBranchesWithDetails(user.id);
        console.log("Branches loaded:", assignedBranches);
        setBranches(assignedBranches);
        
        // Set default branch category based on first branch if available
        if (assignedBranches.length > 0 && form.getValues('branchId')) {
          const selectedBranch = assignedBranches.find(branch => branch.id === form.getValues('branchId'));
          if (selectedBranch) {
            form.setValue('branchCategory', selectedBranch.category);
          }
        }
      } catch (error) {
        console.error("Error loading branches:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load assigned branches.",
        });
      }
    };
    
    loadBranches();
  }, [user]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit a visit form.",
      });
      return;
    }
    
    setLoading(true);
    setSaveStatus("saving");
    
    try {
      // Format the date to YYYY-MM-DD for Supabase
      const formattedDate = format(values.visitDate, 'yyyy-MM-dd');
      
      const visitData = {
        user_id: user.id,
        branch_id: values.branchId,
        visit_date: formattedDate,
        branch_category: values.branchCategory as any,
        hr_connect_session: values.hrConnectSession,
        total_employees_invited: values.totalEmployeesInvited,
        total_participants: values.totalParticipants,
        manning_percentage: values.manningPercentage,
        attrition_percentage: values.attritionPercentage,
        non_vendor_percentage: values.nonVendorPercentage,
        er_percentage: values.erPercentage,
        cwt_cases: values.cwtCases,
        performance_level: values.performanceLevel,
        new_employees_total: values.newEmployeesTotal,
        new_employees_covered: values.newEmployeesCovered,
        star_employees_total: values.starEmployeesTotal,
        star_employees_covered: values.starEmployeesCovered,
        culture_branch: values.cultureBranch,
        line_manager_behavior: values.lineManagerBehavior,
        branch_hygiene: values.branchHygiene,
        overall_discipline: values.overallDiscipline,
        feedback: values.feedback,
        status: "submitted" as const
      };
      
      const result = await createBranchVisit(visitData);
      
      if (result) {
        setSaveStatus("saved");
        toast({
          title: "Success",
          description: "Branch visit has been submitted successfully.",
        });
        
        // Navigate back to visits page after a short delay
        setTimeout(() => {
          navigate("/bh/my-visits");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error submitting visit:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit branch visit.",
      });
      setSaveStatus("idle");
    } finally {
      setLoading(false);
    }
  };
  
  const saveDraft = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to save a draft visit.",
      });
      return;
    }
    
    try {
      setSaveStatus("saving");
      setLoading(true);
      
      const values = form.getValues();
      
      // Make sure required fields are set
      if (!values.branchId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please select a branch before saving.",
        });
        setSaveStatus("idle");
        setLoading(false);
        return;
      }
      
      // Format the date to YYYY-MM-DD for Supabase
      const formattedDate = format(values.visitDate, 'yyyy-MM-dd');
      
      const draftData = {
        user_id: user.id,
        branch_id: values.branchId,
        visit_date: formattedDate,
        branch_category: values.branchCategory as any,
        hr_connect_session: values.hrConnectSession,
        total_employees_invited: values.totalEmployeesInvited,
        total_participants: values.totalParticipants,
        manning_percentage: values.manningPercentage,
        attrition_percentage: values.attritionPercentage,
        non_vendor_percentage: values.nonVendorPercentage,
        er_percentage: values.erPercentage,
        cwt_cases: values.cwtCases,
        performance_level: values.performanceLevel,
        new_employees_total: values.newEmployeesTotal,
        new_employees_covered: values.newEmployeesCovered,
        star_employees_total: values.starEmployeesTotal,
        star_employees_covered: values.starEmployeesCovered,
        culture_branch: values.cultureBranch,
        line_manager_behavior: values.lineManagerBehavior,
        branch_hygiene: values.branchHygiene,
        overall_discipline: values.overallDiscipline,
        feedback: values.feedback,
        status: "draft" as const
      };
      
      const result = await createBranchVisit(draftData);
      
      if (result) {
        setSaveStatus("saved");
        toast({
          title: "Success",
          description: "Draft has been saved successfully.",
        });
        
        // Navigate back to visits page after a short delay
        setTimeout(() => {
          navigate("/bh/my-visits");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save draft.",
      });
      setSaveStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  // Handle branch selection and update category
  const handleBranchChange = (branchId: string) => {
    const selectedBranch = branches.find(branch => branch.id === branchId);
    if (selectedBranch) {
      form.setValue('branchCategory', selectedBranch.category);
    }
  };

  const calculateCoverage = () => {
    const invited = form.getValues("totalEmployeesInvited");
    const participants = form.getValues("totalParticipants");
    if (invited > 0) {
      return Math.round((participants / invited) * 100);
    }
    return 0;
  };

  // Configuration for the qualitative assessment buttons
  const qualitativeOptions = [
    { value: 'very_poor', label: 'Very Poor', color: 'border-red-300 data-[state=checked]:bg-red-100 data-[state=checked]:text-red-700', icon: ThumbsDown },
    { value: 'poor', label: 'Poor', color: 'border-orange-300 data-[state=checked]:bg-orange-100 data-[state=checked]:text-orange-700', icon: Frown },
    { value: 'neutral', label: 'Neutral', color: 'border-blue-300 data-[state=checked]:bg-blue-50 data-[state=checked]:text-blue-700', icon: Meh },
    { value: 'good', label: 'Good', color: 'border-green-300 data-[state=checked]:bg-green-50 data-[state=checked]:text-green-700', icon: Smile },
    { value: 'excellent', label: 'Excellent', color: 'border-emerald-300 data-[state=checked]:bg-emerald-50 data-[state=checked]:text-emerald-700', icon: Star },
  ];

  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-2xl font-bold mb-6">New Branch Visit Form</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Branch Visit Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Basic Information</h2>
                
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          handleBranchChange(value);
                        }}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {branches.length === 0 ? (
                            <SelectItem value="no-branches" disabled>No branches assigned</SelectItem>
                          ) : (
                            branches.map(branch => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name} ({branch.location})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="visitDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Visit Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              className="p-3 pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="branchCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select branch category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="platinum">Platinum</SelectItem>
                            <SelectItem value="diamond">Diamond</SelectItem>
                            <SelectItem value="gold">Gold</SelectItem>
                            <SelectItem value="silver">Silver</SelectItem>
                            <SelectItem value="bronze">Bronze</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* HR Connect Session */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">HR Connect Session</h2>
                
                <FormField
                  control={form.control}
                  name="hrConnectSession"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>HR Connect Session Conducted</FormLabel>
                        <FormDescription>
                          Check if an HR connect session was conducted during the visit
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="totalEmployeesInvited"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Employees Invited</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Participants</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <FormLabel>Coverage Percentage</FormLabel>
                    <div className="h-10 flex items-center justify-center rounded-md border bg-muted/50 px-3">
                      {calculateCoverage()}%
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Branch Metrics */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Branch Metrics</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="manningPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Manning %</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="attritionPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Attrition %</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="nonVendorPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Non-Vendor %</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="erPercentage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ER %</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                            <span className="absolute right-3 top-2.5">%</span>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="cwtCases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>No. of CWT Cases</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) => {
                              field.onChange(parseInt(e.target.value) || 0);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="performanceLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Performance</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select performance level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="average">Average</SelectItem>
                          <SelectItem value="below_average">Below Average</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Employee Coverage */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Employee Coverage</h2>
                
                <div>
                  <h3 className="text-base font-medium mb-3">New Employees (0-6 months)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="newEmployeesTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="newEmployeesCovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Covered</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-base font-medium mb-3">STAR Employees</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="starEmployeesTotal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="starEmployeesCovered"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Covered</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => {
                                field.onChange(parseInt(e.target.value) || 0);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
              
              {/* Qualitative Assessment */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Qualitative Assessment</h2>
                
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="cultureBranch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Culture</FormLabel>
                        <div className="flex flex-wrap gap-2 w-full">
                          {qualitativeOptions.map((option) => (
                            <FormControl key={option.value}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex flex-col h-auto items-center gap-1 p-3 flex-1 min-w-[80px]",
                                  option.color,
                                  field.value === option.value && "border-2"
                                )}
                                onClick={() => field.onChange(option.value)}
                              >
                                <option.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{option.label}</span>
                              </Button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lineManagerBehavior"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Line Manager Behavior</FormLabel>
                        <div className="flex flex-wrap gap-2 w-full">
                          {qualitativeOptions.map((option) => (
                            <FormControl key={option.value}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex flex-col h-auto items-center gap-1 p-3 flex-1 min-w-[80px]",
                                  option.color,
                                  field.value === option.value && "border-2"
                                )}
                                onClick={() => field.onChange(option.value)}
                              >
                                <option.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{option.label}</span>
                              </Button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="branchHygiene"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch Hygiene</FormLabel>
                        <div className="flex flex-wrap gap-2 w-full">
                          {qualitativeOptions.map((option) => (
                            <FormControl key={option.value}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex flex-col h-auto items-center gap-1 p-3 flex-1 min-w-[80px]",
                                  option.color,
                                  field.value === option.value && "border-2"
                                )}
                                onClick={() => field.onChange(option.value)}
                              >
                                <option.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{option.label}</span>
                              </Button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="overallDiscipline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overall Discipline</FormLabel>
                        <div className="flex flex-wrap gap-2 w-full">
                          {qualitativeOptions.map((option) => (
                            <FormControl key={option.value}>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className={cn(
                                  "flex flex-col h-auto items-center gap-1 p-3 flex-1 min-w-[80px]",
                                  option.color,
                                  field.value === option.value && "border-2"
                                )}
                                onClick={() => field.onChange(option.value)}
                              >
                                <option.icon className="h-5 w-5" />
                                <span className="text-xs font-medium">{option.label}</span>
                              </Button>
                            </FormControl>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Overall Feedback */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Overall Feedback</h2>
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional comments or observations (optional)"
                          className="resize-none min-h-[120px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum 200 words
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={saveDraft}
                  disabled={loading}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save as Draft
                    </>
                  )}
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700" 
                  disabled={loading}
                >
                  {saveStatus === "saving" ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Visit
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewVisit;
