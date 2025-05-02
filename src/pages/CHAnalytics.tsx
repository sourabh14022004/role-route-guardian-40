
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  const [visiblePerformanceMetrics, setVisiblePerformanceMetrics] = useState<MetricKey[]>(['branchCoverage', 'manning']);
  const [visibleCategoryMetrics, setVisibleCategoryMetrics] = useState<string[]>(['manning', 'attrition']);
  
  // Colors for metrics
  const metricColors = {
    branchCoverage: "#3b82f6", // blue
    participationRate: "#8b5cf6", // purple
    manning: "#10b981", // green
    attrition: "#ef4444", // red
    er: "#f59e0b", // amber
    nonVendor: "#6366f1" // indigo
  };
  
  const metricLabels = {
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
  
  const togglePerformanceMetric = (values: string[]) => {
    setVisiblePerformanceMetrics(values as MetricKey[]);
  };
  
  const toggleCategoryMetric = (values: string[]) => {
    setVisibleCategoryMetrics(values);
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
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-2xl">Performance Trends</CardTitle>
                <div className="flex flex-col md:flex-row gap-4">
                  <ToggleGroup type="multiple" value={visiblePerformanceMetrics} onValueChange={togglePerformanceMetric}>
                    <ToggleGroupItem value="branchCoverage">Coverage</ToggleGroupItem>
                    <ToggleGroupItem value="participationRate">Participation</ToggleGroupItem>
                    <ToggleGroupItem value="manning">Manning</ToggleGroupItem>
                    <ToggleGroupItem value="attrition">Attrition</ToggleGroupItem>
                    <ToggleGroupItem value="er">ER</ToggleGroupItem>
                    <ToggleGroupItem value="nonVendor">Non-Vendor</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mt-4 gap-4">
                <CardDescription>Branch performance metrics over time</CardDescription>
                <div className="flex items-center gap-2">
                  <ToggleGroup type="single" value={timeRange} onValueChange={handleTimeRangeChange}>
                    <ToggleGroupItem value="lastSevenDays">7 Days</ToggleGroupItem>
                    <ToggleGroupItem value="lastMonth">Month</ToggleGroupItem>
                    <ToggleGroupItem value="lastThreeMonths">3 Months</ToggleGroupItem>
                    <ToggleGroupItem value="lastYear">Year</ToggleGroupItem>
                  </ToggleGroup>
                  {timeRange === "custom" && (
                    <DateRangePicker 
                      value={dateRange || { from: undefined, to: undefined }} 
                      onChange={handleDateRangeChange} 
                    />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                          stroke={metricColors.branchCoverage} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('participationRate') && (
                        <Line 
                          type="monotone" 
                          dataKey="participationRate" 
                          name="Participation Rate %" 
                          stroke={metricColors.participationRate} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('manning') && (
                        <Line 
                          type="monotone" 
                          dataKey="manningPercentage" 
                          name="Manning %" 
                          stroke={metricColors.manning} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('attrition') && (
                        <Line 
                          type="monotone" 
                          dataKey="attritionRate" 
                          name="Attrition %" 
                          stroke={metricColors.attrition} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('er') && (
                        <Line 
                          type="monotone" 
                          dataKey="erPercentage" 
                          name="ER %" 
                          stroke={metricColors.er} 
                          strokeWidth={2} 
                        />
                      )}
                      {visiblePerformanceMetrics.includes('nonVendor') && (
                        <Line 
                          type="monotone" 
                          dataKey="nonVendorPercentage" 
                          name="Non-Vendor %" 
                          stroke={metricColors.nonVendor} 
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
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle className="text-lg font-medium">Category-wise Metrics</CardTitle>
                <ToggleGroup type="multiple" value={visibleCategoryMetrics} onValueChange={toggleCategoryMetric}>
                  <ToggleGroupItem value="manning">Manning</ToggleGroupItem>
                  <ToggleGroupItem value="attrition">Attrition</ToggleGroupItem>
                  <ToggleGroupItem value="er">ER</ToggleGroupItem>
                  <ToggleGroupItem value="cwt">CWT</ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex justify-between items-center mt-2">
                <CardDescription>Metrics by branch category</CardDescription>
                <DateRangePicker 
                  value={dateRange || { from: undefined, to: undefined }} 
                  onChange={handleDateRangeChange} 
                />
              </div>
            </CardHeader>
            <CardContent>
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
            <CardHeader className="pb-3">
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
