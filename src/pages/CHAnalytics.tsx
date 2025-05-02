
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  Bar
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { getVisitMetrics, getPerformanceTrends } from "@/services/branchService";
import QualitativeHeatmap from "@/components/ch/QualitativeHeatmap";

// Define date range type
type DateRange = { from: Date; to: Date } | undefined;

// Define metric toggle type
type MetricKey = 'branchCoverage' | 'participationRate' | 'manning' | 'attrition' | 'er' | 'nonVendor';

const CHAnalytics = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [timeRange, setTimeRange] = useState<string>("lastSevenDays");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);
  
  // State for metric visibility toggles
  const [visiblePerformanceMetrics, setVisiblePerformanceMetrics] = useState<MetricKey[]>([
    'branchCoverage', 
    'participationRate'
  ]);
  const [visibleCategoryMetrics, setVisibleCategoryMetrics] = useState<string[]>(['manning', 'attrition']);
  
  // Colors for metrics
  const metricColors: Record<string, { color: string }> = {
    branchCoverage: { color: "#3b82f6" }, // blue
    participationRate: { color: "#10b981" }, // green
    manning: { color: "#f59e0b" }, // amber
    attrition: { color: "#ef4444" }, // red
    er: { color: "#8b5cf6" }, // purple
    nonVendor: { color: "#6366f1" } // indigo
  };
  
  const metricLabels: Record<string, string> = {
    branchCoverage: "Branch Coverage",
    participationRate: "Participation Rate",
    manning: "Manning %",
    attrition: "Attrition %",
    er: "ER %",
    nonVendor: "Non-Vendor %"
  };

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
        const trendsData = await getPerformanceTrends(timeRange);
        setPerformanceData(trendsData);
      } catch (error) {
        console.error("Error loading performance trends:", error);
      } finally {
        setIsPerformanceLoading(false);
      }
    };
    
    loadPerformanceTrends();
  }, [timeRange, dateRange]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
    setTimeRange("custom");
  };
  
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== "custom") {
      setDateRange(undefined);
    }
  };
  
  const togglePerformanceMetric = (metric: MetricKey) => {
    setVisiblePerformanceMetrics((current) => {
      if (current.includes(metric)) {
        return current.filter(m => m !== metric);
      } else {
        return [...current, metric];
      }
    });
  };
  
  const toggleCategoryMetric = (metric: string) => {
    setVisibleCategoryMetrics((current) => {
      if (current.includes(metric)) {
        return current.filter(m => m !== metric);
      } else {
        return [...current, metric];
      }
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Branch Analytics</h1>
        <p className="text-lg text-slate-600">Branch performance and HR metrics analysis</p>
      </div>
      
      <Tabs defaultValue="performance" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="performance">Performance Trends</TabsTrigger>
          <TabsTrigger value="keyMetrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="qualitative">Qualitative Assessment</TabsTrigger>
        </TabsList>
        
        {/* Performance Trends Tab */}
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-2xl">Performance Trends</CardTitle>
                  <CardDescription className="mt-2">Branch coverage and metrics over time</CardDescription>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant={timeRange === "lastSevenDays" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastSevenDays")}
                  >
                    Last 7 Days
                  </Button>
                  <Button 
                    variant={timeRange === "lastMonth" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastMonth")}
                  >
                    Last Month
                  </Button>
                  <Button 
                    variant={timeRange === "lastThreeMonths" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastThreeMonths")}
                  >
                    Last 3 Months
                  </Button>
                  <Button 
                    variant={timeRange === "lastSixMonths" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastSixMonths")}
                  >
                    Last 6 Months
                  </Button>
                  <Button 
                    variant={timeRange === "lastYear" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastYear")}
                  >
                    Last Year
                  </Button>
                  <Button 
                    variant={timeRange === "lastThreeYears" ? "default" : "outline"} 
                    onClick={() => handleTimeRangeChange("lastThreeYears")}
                  >
                    Last 3 Years
                  </Button>
                </div>
              </div>
              
              {timeRange === "custom" && (
                <div className="mt-4">
                  <DateRangePicker 
                    value={dateRange || { from: undefined, to: undefined }} 
                    onChange={handleDateRangeChange} 
                  />
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4">Select Metrics to Display:</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="branchCoverage" 
                      checked={visiblePerformanceMetrics.includes('branchCoverage')}
                      onCheckedChange={() => togglePerformanceMetric('branchCoverage')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                      <Label htmlFor="branchCoverage">Branch Coverage</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="participationRate" 
                      checked={visiblePerformanceMetrics.includes('participationRate')}
                      onCheckedChange={() => togglePerformanceMetric('participationRate')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <Label htmlFor="participationRate">Participation Rate</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="manning" 
                      checked={visiblePerformanceMetrics.includes('manning')}
                      onCheckedChange={() => togglePerformanceMetric('manning')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                      <Label htmlFor="manning">Manning %</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="attrition" 
                      checked={visiblePerformanceMetrics.includes('attrition')}
                      onCheckedChange={() => togglePerformanceMetric('attrition')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <Label htmlFor="attrition">Attrition %</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="er" 
                      checked={visiblePerformanceMetrics.includes('er')}
                      onCheckedChange={() => togglePerformanceMetric('er')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                      <Label htmlFor="er">ER %</Label>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="nonVendor" 
                      checked={visiblePerformanceMetrics.includes('nonVendor')}
                      onCheckedChange={() => togglePerformanceMetric('nonVendor')}
                    />
                    <div className="flex items-center space-x-2">
                      <div className="h-3 w-3 rounded-full bg-indigo-500"></div>
                      <Label htmlFor="nonVendor">Non-Vendor %</Label>
                    </div>
                  </div>
                </div>
              </div>
              
              {isPerformanceLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : performanceData.length > 0 ? (
                <ChartContainer config={metricColors}>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart 
                      data={performanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      {visiblePerformanceMetrics.includes('branchCoverage') && (
                        <Line 
                          type="monotone" 
                          dataKey="branchCoverage" 
                          name="Branch Coverage %" 
                          stroke={metricColors.branchCoverage.color} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('participationRate') && (
                        <Line 
                          type="monotone" 
                          dataKey="participationRate" 
                          name="Participation Rate %" 
                          stroke={metricColors.participationRate.color} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('manning') && (
                        <Line 
                          type="monotone" 
                          dataKey="manningPercentage" 
                          name="Manning %" 
                          stroke={metricColors.manning.color} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('attrition') && (
                        <Line 
                          type="monotone" 
                          dataKey="attritionRate" 
                          name="Attrition %" 
                          stroke={metricColors.attrition.color} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('er') && (
                        <Line 
                          type="monotone" 
                          dataKey="erPercentage" 
                          name="ER %" 
                          stroke={metricColors.er.color} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('nonVendor') && (
                        <Line 
                          type="monotone" 
                          dataKey="nonVendorPercentage" 
                          name="Non-Vendor %" 
                          stroke={metricColors.nonVendor.color} 
                          strokeWidth={2} 
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="h-16 w-16 text-slate-300 mb-2">📊</div>
                  <p className="text-slate-500">No performance trend data available</p>
                  <p className="text-sm text-slate-400">Data will appear as branch visits are recorded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Key Metrics Tab */}
        <TabsContent value="keyMetrics">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-lg font-medium">Category-wise Metrics</CardTitle>
                  <CardDescription>Metrics by branch category</CardDescription>
                </div>
                <DateRangePicker 
                  value={dateRange || { from: undefined, to: undefined }} 
                  onChange={handleDateRangeChange} 
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Select Metrics to Display:</h3>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="manning-key" 
                      checked={visibleCategoryMetrics.includes('manning')}
                      onCheckedChange={() => toggleCategoryMetric('manning')}
                    />
                    <Label htmlFor="manning-key">Manning</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="attrition-key" 
                      checked={visibleCategoryMetrics.includes('attrition')}
                      onCheckedChange={() => toggleCategoryMetric('attrition')}
                    />
                    <Label htmlFor="attrition-key">Attrition</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="er-key" 
                      checked={visibleCategoryMetrics.includes('er')}
                      onCheckedChange={() => toggleCategoryMetric('er')}
                    />
                    <Label htmlFor="er-key">ER</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="cwt-key" 
                      checked={visibleCategoryMetrics.includes('cwt')}
                      onCheckedChange={() => toggleCategoryMetric('cwt')}
                    />
                    <Label htmlFor="cwt-key">CWT</Label>
                  </div>
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
                    <BarChart data={categoryMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {visibleCategoryMetrics.includes('manning') && (
                        <Bar dataKey="manning" name="Manning" fill="#3b82f6" />
                      )}
                      {visibleCategoryMetrics.includes('attrition') && (
                        <Bar dataKey="attrition" name="Attrition" fill="#ef4444" />
                      )}
                      {visibleCategoryMetrics.includes('er') && (
                        <Bar dataKey="er" name="ER" fill="#10b981" />
                      )}
                      {visibleCategoryMetrics.includes('cwt') && (
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
        </TabsContent>
        
        {/* Qualitative Assessment Tab */}
        <TabsContent value="qualitative">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-medium">Qualitative Assessments Heatmap</CardTitle>
              <CardDescription>Qualitative feedback across branches</CardDescription>
            </CardHeader>
            <CardContent>
              <QualitativeHeatmap />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CHAnalytics;
