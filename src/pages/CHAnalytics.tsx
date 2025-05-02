
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
} from "recharts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchZoneMetrics, fetchMonthlyTrends, fetchQualitativeAssessments } from "@/services/analyticsService";

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
  const [zoneMetrics, setZoneMetrics] = useState([]);
  const [qualitativeData, setQualitativeData] = useState({
    quality: 0,
    satisfaction: 0,
    facilities: 0,
    management: 0,
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

  useEffect(() => {
    const loadAnalyticsData = async () => {
      console.info("Fetching analytics data...");
      setIsLoading(true);
      
      try {
        // Fetch monthly trends data with selected time range
        console.info("Fetching monthly trends...");
        const trendsData = await fetchMonthlyTrends(timeRange);
        setMonthlyTrends(trendsData);
        
        // Fetch zone metrics data
        const metricsData = await fetchZoneMetrics();
        setZoneMetrics(metricsData);
        
        // Fetch qualitative assessment data
        const qualData = await fetchQualitativeAssessments();
        setQualitativeData(qualData);
      } catch (error) {
        console.error("Error loading analytics data:", error);
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
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[
                        { name: 'Platinum', manning: 85, attrition: 5 },
                        { name: 'Diamond', manning: 82, attrition: 7 },
                        { name: 'Gold', manning: 78, attrition: 12 },
                        { name: 'Silver', manning: 75, attrition: 15 },
                        { name: 'Bronze', manning: 70, attrition: 18 },
                      ]}
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
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[
                        { name: 'Platinum', er: 2, cwt: 1 },
                        { name: 'Diamond', er: 3, cwt: 2 },
                        { name: 'Gold', er: 5, cwt: 4 },
                        { name: 'Silver', er: 8, cwt: 6 },
                        { name: 'Bronze', er: 12, cwt: 8 },
                      ]}
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
            
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Zone Performance Analysis</CardTitle>
                <CardDescription>
                  Comparative metrics across different zones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={zoneMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="coverage" name="Coverage %" fill="#3b82f6" />
                      <Bar dataKey="participation" name="Participation %" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            
            <Card className="col-span-1 md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Zone HR Metrics</CardTitle>
                <CardDescription>
                  HR metrics by zone
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center h-80">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={zoneMetrics}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="manning" name="Manning %" fill="#f59e0b" />
                      <Bar dataKey="attrition" name="Attrition %" fill="#ef4444" />
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
              <CardTitle>Qualitative Branch Assessments</CardTitle>
              <CardDescription>
                Aggregated qualitative metrics from branch visits (based on {qualitativeData.count} assessments)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-80">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    {[
                      { name: 'Quality Rating', value: qualitativeData.quality, color: '#3b82f6', max: 5 },
                      { name: 'Employee Satisfaction', value: qualitativeData.satisfaction, color: '#10b981', max: 5 },
                      { name: 'Facilities Rating', value: qualitativeData.facilities, color: '#8b5cf6', max: 5 },
                      { name: 'Management Effectiveness', value: qualitativeData.management, color: '#f59e0b', max: 5 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm font-bold">{item.value} / {item.max}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(item.value / item.max) * 100}%`,
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

                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={[
                        { name: 'Quality', value: qualitativeData.quality },
                        { name: 'Satisfaction', value: qualitativeData.satisfaction },
                        { name: 'Facilities', value: qualitativeData.facilities },
                        { name: 'Management', value: qualitativeData.management },
                      ]}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Rating (out of 5)" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CHAnalytics;
