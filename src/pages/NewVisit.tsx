
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar as CalendarIcon } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

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
  sourceMix: z.string().optional(),
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
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
    setSaveStatus("saving");
    
    // Here you would save to Supabase
    setTimeout(() => {
      setSaveStatus("saved");
      // Reset after a short delay
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 1000);
  };
  
  const saveDraft = () => {
    const values = form.getValues();
    console.log("Saving draft:", values);
    setSaveStatus("saving");
    
    // Save draft logic
    setTimeout(() => {
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    }, 1000);
  };

  const calculateCoverage = () => {
    const invited = form.getValues("totalEmployeesInvited");
    const participants = form.getValues("totalParticipants");
    if (invited > 0) {
      return Math.round((participants / invited) * 100);
    }
    return 0;
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">New Branch Visit Form</h1>
      
      <div className="flex justify-end space-x-2 mb-6">
        <Button
          variant="outline"
          onClick={saveDraft}
          disabled={saveStatus !== "idle"}
        >
          {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Draft"}
        </Button>
      </div>
      
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a branch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="branch1">Branch 1</SelectItem>
                          <SelectItem value="branch2">Branch 2</SelectItem>
                          <SelectItem value="branch3">Branch 3</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <FormField
                  control={form.control}
                  name="sourceMix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Mix</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 60% Direct, 30% Referral, 10% Agency" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                
                <FormField
                  control={form.control}
                  name="cultureBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Culture of Branch</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Very Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">Neutral</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="good" />
                            </FormControl>
                            <FormLabel className="font-normal">Good</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="excellent" />
                            </FormControl>
                            <FormLabel className="font-normal">Excellent</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Very Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">Neutral</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="good" />
                            </FormControl>
                            <FormLabel className="font-normal">Good</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="excellent" />
                            </FormControl>
                            <FormLabel className="font-normal">Excellent</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Very Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">Neutral</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="good" />
                            </FormControl>
                            <FormLabel className="font-normal">Good</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="excellent" />
                            </FormControl>
                            <FormLabel className="font-normal">Excellent</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
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
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col sm:flex-row gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="very_poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Very Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="poor" />
                            </FormControl>
                            <FormLabel className="font-normal">Poor</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="neutral" />
                            </FormControl>
                            <FormLabel className="font-normal">Neutral</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="good" />
                            </FormControl>
                            <FormLabel className="font-normal">Good</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="excellent" />
                            </FormControl>
                            <FormLabel className="font-normal">Excellent</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Employee Feedback */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Employee Feedback & Observations</h2>
                
                <FormField
                  control={form.control}
                  name="feedback"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Please provide a detailed summary of employee feedback and your observations in 100-200 words.</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Summarize the feedback received from employees and your observations..."
                          className="min-h-32"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-xs text-muted-foreground text-right">
                        {field.value ? field.value.split(/\s+/).filter(Boolean).length : 0}/200 words
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
                
                <div className="space-x-2">
                  <Button variant="outline" type="button" onClick={saveDraft}>
                    Save Draft
                  </Button>
                  <Button type="submit">Submit Form</Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewVisit;
