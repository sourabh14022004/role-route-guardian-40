
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { getVisitMetrics, getPerformanceTrends } from "@/services/branchService";
import QualitativeHeatmap from "@/components/ch/QualitativeHeatmap";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Calendar, Check } from "lucide-react";

// Define date range type
type DateRange = { from: Date; to: Date } | undefined;

const PERIOD_OPTIONS = [
  { label: "Last 7 Days", value: "lastWeek" },
  { label: "Last Month", value: "lastMonth" },
  { label: "Last 3 Months", value: "lastQuarter" },
  { label: "Last 6 Months", value: "lastSixMonths" },
  { label: "Last Year", value: "lastYear" }
];

const CHAnalytics = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [selectedChart, setSelectedChart] = useState("monthly");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("lastSixMonths");
  
  // Toggle states for performance metrics
  const [showManning, setShowManning] = useState(true);
  const [showAttrition, setShowAttrition] = useState(true);
  const [showEr, setShowEr] = useState(true);
  const [showNonVendor, setShowNonVendor] = useState(true);
  
  // Toggle states for category metrics
  const [showManningCategory, setShowManningCategory] = useState(true);
  const [showAttritionCategory, setShowAttritionCategory] = useState(true);
  const [showErCategory, setShowErCategory] = useState(true);
  const [showCwtCategory, setShowCwtCategory] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch category-wise metrics
        const metricsData = await getVisitMetrics(dateRange);
        setCategoryMetrics(metricsData);
      } catch (error) {
        console.error("Error loading analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dateRange]);

  useEffect(() => {
    const loadPerformanceTrends = async () => {
      setIsPerformanceLoading(true);
      try {
        // Fetch performance trends with the selected time range
        const trendsData = await getPerformanceTrends(selectedPeriod);
        setPerformanceData(trendsData);
      } catch (error) {
        console.error("Error loading performance trends:", error);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    
    loadPerformanceTrends();
  }, [selectedPeriod]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  const formatXAxis = (tickItem: string) => {
    // If the label is too long, truncate it to first 3 characters
    if (tickItem && tickItem.length > 10) {
      return tickItem.substring(0, 3);
    }
    return tickItem;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Branch Analytics</h1>
        <p className="text-lg text-slate-600">Branch performance and HR metrics analysis</p>
      </div>
      
      <div className="mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="text-2xl">Performance Trends</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <ToggleGroup 
                  type="single" 
                  value={selectedPeriod}
                  onValueChange={(value) => value && handlePeriodChange(value)}
                  className="justify-start"
                >
                  {PERIOD_OPTIONS.map((option) => (
                    <ToggleGroupItem 
                      key={option.value} 
                      value={option.value}
                      aria-label={option.label}
                      className="text-xs sm:text-sm"
                    >
                      {option.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
            <div className="flex flex-wrap justify-between items-center gap-2">
              <CardDescription>Branch performance metrics over time</CardDescription>
              <Tabs defaultValue="monthly" value={selectedChart} onValueChange={setSelectedChart} className="w-full md:w-auto">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch id="manning-toggle" checked={showManning} onCheckedChange={setShowManning} />
                <Label htmlFor="manning-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                  Manning %
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="attrition-toggle" checked={showAttrition} onCheckedChange={setShowAttrition} />
                <Label htmlFor="attrition-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                  Attrition %
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="er-toggle" checked={showEr} onCheckedChange={setShowEr} />
                <Label htmlFor="er-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                  ER %
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="non-vendor-toggle" checked={showNonVendor} onCheckedChange={setShowNonVendor} />
                <Label htmlFor="non-vendor-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500 mr-1"></span>
                  Non-Vendor %
                </Label>
              </div>
            </div>
            
            {isPerformanceLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : performanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart 
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                    tickFormatter={formatXAxis} 
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  {showManning && (
                    <Line type="monotone" dataKey="manning" name="Manning %" stroke="#3b82f6" strokeWidth={2} />
                  )}
                  {showAttrition && (
                    <Line type="monotone" dataKey="attrition" name="Attrition %" stroke="#ef4444" strokeWidth={2} />
                  )}
                  {showEr && (
                    <Line type="monotone" dataKey="er" name="ER %" stroke="#10b981" strokeWidth={2} />
                  )}
                  {showNonVendor && (
                    <Line type="monotone" dataKey="nonVendor" name="Non-Vendor %" stroke="#8b5cf6" strokeWidth={2} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-80">
                <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                <p className="text-slate-500">No performance trend data available</p>
                <p className="text-sm text-slate-400">Data will appear as branch visits are recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Category-wise Metrics</CardTitle>
              <DateRangePicker 
                value={dateRange || { from: undefined, to: undefined }} 
                onChange={handleDateRangeChange} 
              />
            </div>
            <CardDescription>Metrics by branch category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch id="manning-category-toggle" checked={showManningCategory} onCheckedChange={setShowManningCategory} />
                <Label htmlFor="manning-category-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                  Manning
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="attrition-category-toggle" checked={showAttritionCategory} onCheckedChange={setShowAttritionCategory} />
                <Label htmlFor="attrition-category-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-1"></span>
                  Attrition
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="er-category-toggle" checked={showErCategory} onCheckedChange={setShowErCategory} />
                <Label htmlFor="er-category-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
                  ER
                </Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch id="cwt-category-toggle" checked={showCwtCategory} onCheckedChange={setShowCwtCategory} />
                <Label htmlFor="cwt-category-toggle" className="text-sm cursor-pointer">
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                  CWT
                </Label>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : categoryMetrics.length > 0 ? (
              <ChartContainer 
                config={{
                  platinum: { color: '#9333ea' },
                  diamond: { color: '#2563eb' },
                  gold: { color: '#eab308' },
                  silver: { color: '#94a3b8' },
                  bronze: { color: '#f97316' },
                  unknown: { color: '#cbd5e1' }
                }}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart 
                    data={categoryMetrics}
                    margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      interval={0}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {showManningCategory && (
                      <Bar dataKey="manning" name="Manning" fill="#3b82f6" />
                    )}
                    {showAttritionCategory && (
                      <Bar dataKey="attrition" name="Attrition" fill="#ef4444" />
                    )}
                    {showErCategory && (
                      <Bar dataKey="er" name="ER" fill="#10b981" />
                    )}
                    {showCwtCategory && (
                      <Bar dataKey="cwt" name="CWT" fill="#ca8a04" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                <p className="text-slate-500">No category metrics available</p>
                <p className="text-sm text-slate-400">Select a date range to view data</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Metrics Overview</CardTitle>
            <CardDescription>Summary of key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-right">Change</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <div className="flex justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow>
                      <TableCell className="font-medium">Manning %</TableCell>
                      <TableCell className="text-right">85%</TableCell>
                      <TableCell className="text-right">82%</TableCell>
                      <TableCell className="text-right text-green-500 flex justify-end items-center">
                        <ChevronUp className="h-4 w-4" /> 3%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Attrition %</TableCell>
                      <TableCell className="text-right">12%</TableCell>
                      <TableCell className="text-right">15%</TableCell>
                      <TableCell className="text-right text-green-500 flex justify-end items-center">
                        <ChevronDown className="h-4 w-4" /> 3%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">ER %</TableCell>
                      <TableCell className="text-right">92%</TableCell>
                      <TableCell className="text-right">89%</TableCell>
                      <TableCell className="text-right text-green-500 flex justify-end items-center">
                        <ChevronUp className="h-4 w-4" /> 3%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Non-Vendor %</TableCell>
                      <TableCell className="text-right">65%</TableCell>
                      <TableCell className="text-right">62%</TableCell>
                      <TableCell className="text-right text-green-500 flex justify-end items-center">
                        <ChevronUp className="h-4 w-4" /> 3%
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">CWT Cases</TableCell>
                      <TableCell className="text-right">54</TableCell>
                      <TableCell className="text-right">58</TableCell>
                      <TableCell className="text-right text-green-500 flex justify-end items-center">
                        <ChevronDown className="h-4 w-4" /> 4
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Qualitative Assessments Heatmap</CardTitle>
          <CardDescription>Qualitative feedback across branches</CardDescription>
        </CardHeader>
        <CardContent>
          <QualitativeHeatmap dateRange={dateRange} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CHAnalytics;
