
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchMonthlyTrends, fetchQualitativeAssessments } from "@/services/analyticsService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

const timeRangeOptions = [
  { value: "lastSevenDays", label: "Last 7 Days" },
  { value: "lastMonth", label: "Last Month" },
  { value: "lastThreeMonths", label: "Last 3 Months" },
  { value: "lastSixMonths", label: "Last 6 Months" },
  { value: "lastYear", label: "Last Year" },
  { value: "lastThreeYears", label: "Last 3 Years" },
];

const metricOptions = [
  { id: "branchCoverage", label: "Branch Coverage", color: "#3b82f6" },
  { id: "participationRate", label: "Participation Rate", color: "#10b981" },
  { id: "manningPercentage", label: "Manning %", color: "#f59e0b" },
  { id: "attritionRate", label: "Attrition %", color: "#ef4444" },
  { id: "erPercentage", label: "ER %", color: "#8b5cf6" },
  { id: "nonVendorPercentage", label: "Non-Vendor %", color: "#ec4899" },
];

const CHAnalytics = () => {
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [qualitativeData, setQualitativeData] = useState({
    discipline: 0,
    hygiene: 0,
    culture: 0,
    overall: 0,
    behavior: 0,
    count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("lastSixMonths");
  const [selectedMetrics, setSelectedMetrics] = useState({
    branchCoverage: true,
    participationRate: true,
    manningPercentage: false,
    attritionRate: false,
    erPercentage: false,
    nonVendorPercentage: false,
  });
  const [categoryMetrics, setCategoryMetrics] = useState([]);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      console.info("Fetching analytics data...");
      setIsLoading(true);
      
      try {
        // Fetch monthly trends data with selected time range
        console.info("Fetching monthly trends...");
        const trendsData = await fetchMonthlyTrends(timeRange);
        setMonthlyTrends(trendsData);
        
        // Fetch qualitative assessment data
        const qualData = await fetchQualitativeAssessments();
        setQualitativeData(qualData);

        // Fetch category metrics data directly from the branch_visits table
        await fetchCategoryMetrics();
      } catch (error) {
        console.error("Error loading analytics data:", error);
        toast({
          title: "Error loading analytics data",
          description: "There was a problem fetching analytics data.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsData();
  }, [timeRange]);

  const handleMetricToggle = (metricId) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metricId]: !prev[metricId]
    }));
  };

  // At least one metric must be selected
  const atLeastOneMetricSelected = Object.values(selectedMetrics).some(value => value);

  // Fetch real category metrics data from branch_visits
  const fetchCategoryMetrics = async () => {
    try {
      // Get total branches count
      const { count: totalBranches, error: branchError } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true });
      
      if (branchError) throw branchError;
      
      // Get all branch visits with their categories
      const { data: visits, error: visitsError } = await supabase
        .from('branch_visits')
        .select('branch_category, manning_percentage, attrition_percentage, er_percentage, cwt_cases')
        .in('status', ['submitted', 'approved']);
        
      if (visitsError) throw visitsError;
      
      if (!visits || visits.length === 0) {
        console.warn("No branch visits found");
        return;
      }
      
      // Group by category and calculate averages
      const categoryStats = {};
      
      visits.forEach(visit => {
        const category = visit.branch_category ? 
          visit.branch_category.charAt(0).toUpperCase() + visit.branch_category.slice(1) : 'Unknown';
        
        if (!categoryStats[category]) {
          categoryStats[category] = {
            count: 0,
            manning: 0,
            attrition: 0,
            er: 0,
            cwt: 0
          };
        }
        
        categoryStats[category].count++;
        
        if (typeof visit.manning_percentage === 'number') {
          categoryStats[category].manning += visit.manning_percentage;
        }
        
        if (typeof visit.attrition_percentage === 'number') {
          categoryStats[category].attrition += visit.attrition_percentage;
        }
        
        if (typeof visit.er_percentage === 'number') {
          categoryStats[category].er += visit.er_percentage;
        }
        
        if (typeof visit.cwt_cases === 'number') {
          categoryStats[category].cwt += visit.cwt_cases;
        }
      });
      
      // Calculate averages and format data
      const formattedData = Object.entries(categoryStats).map(([category, stats]) => ({
        name: category,
        manning: Math.round(stats.manning / stats.count) || 0,
        attrition: Math.round(stats.attrition / stats.count) || 0,
        er: Math.round(stats.er / stats.count) || 0,
        cwt: Math.round(stats.cwt / stats.count) || 0
      }));
      
      console.log("Category metrics:", formattedData);
      setCategoryMetrics(formattedData);
      
    } catch (error) {
      console.error("Error fetching category metrics:", error);
      toast({
        title: "Error loading category metrics",
        description: "There was a problem fetching category metrics data.",
        variant: "destructive"
      });
    }
  };

  // Format tooltip value with proper type checking
  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}/5`;
    }
    return `${value}/5`;
  };

  // Prepare radar data for the qualitative assessment
  const radarData = [
    {
      subject: "Discipline",
      value: qualitativeData.discipline,
      fullMark: 5,
    },
    {
      subject: "Hygiene",
      value: qualitativeData.hygiene,
      fullMark: 5,
    },
    {
      subject: "Culture",
      value: qualitativeData.culture,
      fullMark: 5,
    },
    {
      subject: "Behavior",
      value: qualitativeData.behavior,
      fullMark: 5,
    },
    {
      subject: "Overall",
      value: qualitativeData.overall,
      fullMark: 5,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Coverage Trends</TabsTrigger>
          <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
          <TabsTrigger value="qualitative">Qualitative Data</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card className="w-full">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle>Performance Trends</CardTitle>
                  <CardDescription>
                    Branch coverage and metrics over time
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {timeRangeOptions.map(option => (
                    <Button 
                      key={option.value}
                      variant={timeRange === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTimeRange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Select Metrics to Display:</h4>
                <div className="flex flex-wrap gap-4">
                  {metricOptions.map(metric => (
                    <div key={metric.id} className="flex items-center gap-2">
                      <Switch 
                        id={`metric-${metric.id}`} 
                        checked={selectedMetrics[metric.id]}
                        disabled={!selectedMetrics[metric.id] && !atLeastOneMetricSelected}
                        onCheckedChange={() => handleMetricToggle(metric.id)}
                      />
                      <Label 
                        htmlFor={`metric-${metric.id}`}
                        className="flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: metric.color }}
                        ></div>
                        {metric.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart
                    data={monthlyTrends}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {selectedMetrics.branchCoverage && (
                      <Line
                        type="monotone"
                        dataKey="branchCoverage"
                        name="Branch Coverage %"
                        stroke="#3b82f6"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    )}
                    {selectedMetrics.participationRate && (
                      <Line
                        type="monotone"
                        dataKey="participationRate"
                        name="Participation Rate %"
                        stroke="#10b981"
                        strokeWidth={2}
                      />
                    )}
                    {selectedMetrics.manningPercentage && (
                      <Line
                        type="monotone"
                        dataKey="manningPercentage"
                        name="Manning %"
                        stroke="#f59e0b"
                        strokeWidth={2}
                      />
                    )}
                    {selectedMetrics.attritionRate && (
                      <Line
                        type="monotone"
                        dataKey="attritionRate"
                        name="Attrition %"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                    )}
                    {selectedMetrics.erPercentage && (
                      <Line
                        type="monotone"
                        dataKey="erPercentage"
                        name="ER %"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                    )}
                    {selectedMetrics.nonVendorPercentage && (
                      <Line
                        type="monotone"
                        dataKey="nonVendorPercentage"
                        name="Non-Vendor %"
                        stroke="#ec4899"
                        strokeWidth={2}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>HR Metrics by Branch Category</CardTitle>
                <CardDescription>
                  Manning and attrition percentages by branch category
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : categoryMetrics.length === 0 ? (
                  <div className="flex justify-center items-center h-80 text-center text-muted-foreground">
                    <p>No category data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={categoryMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="manning" name="Manning %" fill="#3b82f6" />
                      <Bar dataKey="attrition" name="Attrition %" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Performance Metrics Comparison</CardTitle>
                <CardDescription>
                  Comparing ER and CWT metrics across branch categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : categoryMetrics.length === 0 ? (
                  <div className="flex justify-center items-center h-80 text-center text-muted-foreground">
                    <p>No category data available</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={categoryMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="er" name="ER %" fill="#8b5cf6" />
                      <Bar dataKey="cwt" name="CWT Cases" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="qualitative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branch Qualitative Assessment</CardTitle>
              <CardDescription>
                Aggregated branch assessment ratings from {qualitativeData.count} branch visits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Radar Chart for Qualitative Assessment */}
                  <div className="col-span-1 md:col-span-1">
                    <h3 className="text-lg font-medium mb-4 text-center">Assessment Heat Map</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <RadarChart outerRadius={120} width={400} height={350} data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 5]} />
                        <Radar
                          name="Branch Quality Score"
                          dataKey="value"
                          stroke="#8884d8"
                          fill="#8884d8"
                          fillOpacity={0.6}
                        />
                        <Tooltip formatter={(value) => {
                          return typeof value === 'number' ? [`${value.toFixed(1)}/5`, 'Rating'] : [`${value}/5`, 'Rating'];
                        }} />
                        <Legend />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Bar Chart for Qualitative Values */}
                  <div className="col-span-1 md:col-span-1">
                    <h3 className="text-lg font-medium mb-4 text-center">Assessment Metrics</h3>
                    <div className="space-y-6">
                      {[
                        { name: 'Discipline Rating', value: qualitativeData.discipline, color: '#3b82f6', max: 5 },
                        { name: 'Hygiene Rating', value: qualitativeData.hygiene, color: '#10b981', max: 5 },
                        { name: 'Culture Rating', value: qualitativeData.culture, color: '#8b5cf6', max: 5 },
                        { name: 'Manager Behavior', value: qualitativeData.behavior, color: '#ec4899', max: 5 },
                        { name: 'Overall Rating', value: qualitativeData.overall, color: '#f59e0b', max: 5 },
                      ].map((item, idx) => (
                        <div key={idx} className="flex flex-col">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">{item.name}</span>
                            <span className="text-sm font-bold">
                              {typeof item.value === 'number' ? item.value.toFixed(1) : item.value} / {item.max}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${((typeof item.value === 'number' ? item.value : 0) / item.max) * 100}%`,
                                backgroundColor: item.color,
                              }}
                            />
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground">Poor</span>
                            <span className="text-xs text-muted-foreground">Excellent</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CHAnalytics;
