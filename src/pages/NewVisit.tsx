
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

const NewVisit = () => {
  const [date, setDate] = useState<Date>();
  const [wordCount, setWordCount] = useState(0);
  
  const branchCategories = ["Platinum", "Diamond", "Gold", "Silver", "Bronze"];
  const performanceLevels = ["Excellent", "Good", "Average", "Below Average", "Poor"];
  const ratingOptions = ["Very Poor", "Poor", "Neutral", "Good", "Excellent"];

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount(words);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">New Branch Visit Form</h1>
        <div className="space-x-4">
          <Button variant="outline">Save Draft</Button>
          <Button>Submit Form</Button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="branch1">Branch 1</SelectItem>
                    <SelectItem value="branch2">Branch 2</SelectItem>
                    <SelectItem value="branch3">Branch 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Visit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Select a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Branch Category</Label>
                <Select defaultValue="Gold">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branchCategories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HR Connect Session */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">HR Connect Session</h2>
            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="hr-connect" className="w-4 h-4" />
                <Label htmlFor="hr-connect">HR Connect Session Conducted</Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Total Employees Invited</Label>
                  <Input type="number" min="0" defaultValue="0" />
                </div>
                <div className="space-y-2">
                  <Label>Total Participants</Label>
                  <Input type="number" min="0" defaultValue="0" />
                </div>
                <div className="space-y-2">
                  <Label>Coverage Percentage</Label>
                  <Input type="text" value="0%" readOnly />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branch Metrics */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Branch Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Manning %</Label>
                <div className="relative">
                  <Input type="number" min="0" max="100" defaultValue="0" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Attrition %</Label>
                <div className="relative">
                  <Input type="number" min="0" max="100" defaultValue="0" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Source Mix</Label>
                <Input placeholder="e.g. 60% Direct, 30% Referral, 10% Agency" />
              </div>

              <div className="space-y-2">
                <Label>Non-Vendor %</Label>
                <div className="relative">
                  <Input type="number" min="0" max="100" defaultValue="0" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>ER %</Label>
                <div className="relative">
                  <Input type="number" min="0" max="100" defaultValue="0" />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-slate-500">%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>No. of CWT Cases</Label>
                <Input type="number" min="0" defaultValue="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Performance</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Select performance level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select performance level" />
                  </SelectTrigger>
                  <SelectContent>
                    {performanceLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Coverage */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Employee Coverage</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">New Employees (0-6 months)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Covered</Label>
                    <Input type="number" min="0" defaultValue="0" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">STAR Employees</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Total</Label>
                    <Input type="number" min="0" defaultValue="0" />
                  </div>
                  <div className="space-y-2">
                    <Label>Covered</Label>
                    <Input type="number" min="0" defaultValue="0" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualitative Assessment */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Qualitative Assessment</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Culture of Branch</Label>
                <RadioGroup defaultValue="neutral" className="flex space-x-4">
                  {ratingOptions.map(option => (
                    <div key={option} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={option.toLowerCase().replace(" ", "-")} id={`culture-${option}`} />
                      <Label htmlFor={`culture-${option}`} className="text-xs cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Line Manager Behavior</Label>
                <RadioGroup defaultValue="neutral" className="flex space-x-4">
                  {ratingOptions.map(option => (
                    <div key={option} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={option.toLowerCase().replace(" ", "-")} id={`manager-${option}`} />
                      <Label htmlFor={`manager-${option}`} className="text-xs cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Branch Hygiene</Label>
                <RadioGroup defaultValue="neutral" className="flex space-x-4">
                  {ratingOptions.map(option => (
                    <div key={option} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={option.toLowerCase().replace(" ", "-")} id={`hygiene-${option}`} />
                      <Label htmlFor={`hygiene-${option}`} className="text-xs cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Overall Discipline</Label>
                <RadioGroup defaultValue="neutral" className="flex space-x-4">
                  {ratingOptions.map(option => (
                    <div key={option} className="flex flex-col items-center space-y-1">
                      <RadioGroupItem value={option.toLowerCase().replace(" ", "-")} id={`discipline-${option}`} />
                      <Label htmlFor={`discipline-${option}`} className="text-xs cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback & Observations */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Employee Feedback & Observations</h2>
            <div className="space-y-4">
              <Label htmlFor="feedback">
                Please provide a detailed summary of employee feedback and your observations in 100-200 words.
              </Label>
              <Textarea 
                id="feedback" 
                placeholder="Summarize the feedback received from employees and your observations..."
                rows={5}
                onChange={handleTextareaChange}
              />
              <div className="text-right text-sm text-slate-500">
                {wordCount}/200 words
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pb-12">
          <Button variant="outline">Cancel</Button>
          <Button variant="outline">Save Draft</Button>
          <Button>Submit Form</Button>
        </div>
      </div>
    </div>
  );
};

export default NewVisit;
