
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { getVisitMetrics, getPerformanceTrends } from "@/services/branchService";
import { fetchZoneMetrics } from "@/services/analyticsService";
import QualitativeHeatmap from "@/components/ch/QualitativeHeatmap";

// Define date range type
type DateRange = { from: Date; to: Date } | undefined;

const CHAnalytics = () => {
  // State for date range filter
  const [dateRange, setDateRange] = useState<DateRange>(undefined);
  const [selectedChart, setSelectedChart] = useState("monthly");
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryMetrics, setCategoryMetrics] = useState<any[]>([]);
  const [zoneMetrics, setZoneMetrics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch category-wise metrics
        const metricsData = await getVisitMetrics(dateRange);
        setCategoryMetrics(metricsData);
        
        // Fetch zone-wise metrics
        const zoneData = await fetchZoneMetrics();
        setZoneMetrics(zoneData);
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
        // Determine the time range based on the selected chart tab
        let timeRange = 'lastSixMonths';
        switch (selectedChart) {
          case 'monthly':
            timeRange = 'lastSixMonths';
            break;
          case 'quarterly':
            timeRange = 'lastYear';
            break;
          case 'yearly':
            timeRange = 'lastThreeYears';
            break;
        }
        
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
  }, [selectedChart]);

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  
  const formatNumber = (value: number) => {
    return isNaN(value) ? '0' : value.toString();
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <CardTitle className="text-2xl">Performance Trends</CardTitle>
              <Tabs defaultValue="monthly" value={selectedChart} onValueChange={setSelectedChart} className="w-full md:w-auto mt-4 md:mt-0">
                <TabsList>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>Branch performance metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isPerformanceLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : performanceData.length > 0 ? (
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
                  <Line type="monotone" dataKey="manning" name="Manning %" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="attrition" name="Attrition %" stroke="#ef4444" strokeWidth={2} />
                  <Line type="monotone" dataKey="er" name="ER %" stroke="#10b981" strokeWidth={2} />
                  <Line type="monotone" dataKey="nonVendor" name="Non-Vendor %" stroke="#8b5cf6" strokeWidth={2} />
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
                    <Bar dataKey="manning" name="Manning" fill="#3b82f6" />
                    <Bar dataKey="attrition" name="Attrition" fill="#ef4444" />
                    <Bar dataKey="er" name="ER" fill="#10b981" />
                    <Bar dataKey="cwt" name="CWT" fill="#ca8a04" />
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
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Zone-wise Metrics</CardTitle>
            <CardDescription>Metrics by zone</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : zoneMetrics.length > 0 ? (
              <ChartContainer
                config={{
                  north: { color: '#3b82f6' },
                  south: { color: '#10b981' },
                  east: { color: '#f59e0b' },
                  west: { color: '#ef4444' },
                  central: { color: '#8b5cf6' }
                }}
              >
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={zoneMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="coverage" name="Coverage" fill="#3b82f6" />
                    <Bar dataKey="participation" name="Participation" fill="#10b981" />
                    <Bar dataKey="manning" name="Manning" fill="#f59e0b" />
                    <Bar dataKey="attrition" name="Attrition" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="h-16 w-16 text-slate-300 mb-2">🗺️</div>
                <p className="text-slate-500">No zone metrics available</p>
                <p className="text-sm text-slate-400">Data will appear as branch visits are recorded</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Qualitative Assessments Heatmap</CardTitle>
          <CardDescription>Qualitative feedback across branches</CardDescription>
        </CardHeader>
        <CardContent>
          <QualitativeHeatmap />
        </CardContent>
      </Card>
    </div>
  );
};

export default CHAnalytics;
