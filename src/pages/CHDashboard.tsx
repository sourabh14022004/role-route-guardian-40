
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { BarList } from "@/components/ui/bar-list";
import { fetchDashboardStats, fetchTopPerformers, fetchCategoryBreakdown, fetchQualitativeAssessments } from "@/services/analyticsService";
import { getCoverageParticipationTrends } from "@/services/branchService";
import { CircleCheck, Users, PieChart as PieChartIcon, Star, Briefcase, CheckCircle2, TrendingUp, Clock } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

const CHDashboard = () => {
  const [stats, setStats] = useState({
    totalBranches: 0,
    visitedBranchesCount: 0,
    currentCoverage: 0,
    uniqueBhrIds: 0,
    currentManningAvg: 0,
    currentAttritionAvg: 0,
    currentErAvg: 0,
    nonVendorAvg: 0,
    cwTotalCases: 0
  });
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [qualitativeData, setQualitativeData] = useState({
    discipline: 0,
    hygiene: 0,
    culture: 0,
    overall: 0,
    count: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendsLoading, setIsTrendsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      console.info("Fetching dashboard stats...");
      setIsLoading(true);
      
      try {
        // Fetch dashboard summary stats
        const dashboardStats = await fetchDashboardStats();
        setStats(dashboardStats);
        
        // Fetch category breakdown (real data from database)
        console.info("Fetching category breakdown...");
        const breakdown = await fetchCategoryBreakdown();
        setCategoryBreakdown(breakdown);
        
        // Fetch top performers
        console.info("Fetching top performers...");
        const performers = await fetchTopPerformers();
        setTopPerformers(performers);
        
        // Fetch qualitative assessment data
        console.info("Fetching qualitative assessments...");
        const qualitativeStats = await fetchQualitativeAssessments();
        setQualitativeData(qualitativeStats);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const loadTrendsData = async () => {
      setIsTrendsLoading(true);
      try {
        console.info("Fetching monthly trends from database...");
        const trendsData = await getCoverageParticipationTrends('lastSixMonths');
        setMonthlyTrends(trendsData);
      } catch (error) {
        console.error("Error loading trends data:", error);
      } finally {
        setIsTrendsLoading(false);
      }
    };

    loadDashboardData();
    loadTrendsData();
  }, []);

  // Format rating text for display
  const formatRatingText = (rating) => {
    const ratingMap = {
      'very_poor': 'Very Poor',
      'poor': 'Poor',
      'neutral': 'Neutral',
      'good': 'Good',
      'excellent': 'Excellent'
    };
    return ratingMap[rating] || rating;
  };

  // Map ratings to numbers for the radar chart
  const mapRatingToNumber = (rating) => {
    const ratingValues = {
      'very_poor': 1,
      'poor': 2,
      'neutral': 3,
      'good': 4,
      'excellent': 5
    };
    return ratingValues[rating] || 3;
  };

  // Prepare qualitative data for visualization
  const prepareQualitativeData = () => {
    return [
      { subject: 'Branch Culture', value: qualitativeData.culture },
      { subject: 'Branch Hygiene', value: qualitativeData.hygiene },
      { subject: 'Overall Discipline', value: qualitativeData.discipline },
      { subject: 'Overall Rating', value: qualitativeData.overall }
    ];
  };

  // Fixed tooltip formatter function to handle different value types
  const formatTooltipValue = (value) => {
    if (typeof value === 'number') {
      return value.toFixed(1);
    }
    return value;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Channel Head Dashboard</h1>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-blue-600">Branch Coverage</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentCoverage}%</p>
                <p className="text-sm text-slate-500">{stats.visitedBranchesCount} of {stats.totalBranches}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-green-600">Active BHRs</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.uniqueBhrIds}</p>
                <p className="text-sm text-slate-500">Submitting reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-amber-600">Avg Manning</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentManningAvg}%</p>
                <p className="text-sm text-slate-500">Current month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-red-600">Avg Attrition</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentAttritionAvg}%</p>
                <p className="text-sm text-slate-500">Current month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-purple-600">Non-Vendor %</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.nonVendorAvg}%</p>
                <p className="text-sm text-slate-500">Current month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-pink-600">CWT Cases</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.cwTotalCases}</p>
                <p className="text-sm text-slate-500">Current month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-teal-600">Avg ER</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{stats.currentErAvg}%</p>
                <p className="text-sm text-slate-500">Current month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
          <CardContent className="p-6">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-indigo-600">Branch Quality</p>
              <div className="flex items-end justify-between">
                <p className="text-3xl font-bold">{qualitativeData.overall.toFixed(1)}</p>
                <p className="text-sm text-slate-500">/5 rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend chart - takes full width */}
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Coverage & Participation Trends</CardTitle>
            <CardDescription>
              Branch coverage and employee participation rate over the past 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isTrendsLoading ? (
              <div className="flex justify-center items-center h-80">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
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
                  <Line
                    type="monotone"
                    dataKey="branchCoverage"
                    name="Branch Coverage %"
                    stroke="#3b82f6"
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="participationRate"
                    name="Participation Rate %"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col justify-center items-center h-80">
                <TrendingUp className="h-16 w-16 text-slate-300 mb-2" />
                <p className="text-slate-500 text-lg">No trend data available</p>
                <p className="text-slate-400 text-sm mt-1">Data will appear as branch visits are recorded</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Branch Category Distribution</CardTitle>
            <CardDescription>
              Distribution of branches by category from visit data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : categoryBreakdown && categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} branches`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <PieChartIcon className="h-12 w-12 mb-2 opacity-30" />
                <p>No category data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Qualitative Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Qualitative Assessment</CardTitle>
            <CardDescription>
              Branch quality metrics from {qualitativeData.count} branch visits
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : qualitativeData.count > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart outerRadius={90} data={prepareQualitativeData()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis domain={[0, 5]} />
                  <Radar
                    name="Quality Rating"
                    dataKey="value"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value) => {
                    return typeof value === 'number' ? [`${value.toFixed(1)}/5`, 'Rating'] : [`${value}/5`, 'Rating'];
                  }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Star className="h-12 w-12 mb-2 opacity-30" />
                <p>No qualitative assessment data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing BHs</CardTitle>
            <CardDescription>
              BHs with the highest coverage rates and report submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            ) : topPerformers && topPerformers.length > 0 ? (
              <div className="space-y-6">
                <Tabs defaultValue="coverage">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="coverage">By Coverage</TabsTrigger>
                    <TabsTrigger value="reports">By Reports</TabsTrigger>
                  </TabsList>
                  <TabsContent value="coverage" className="pt-4">
                    <BarList
                      data={topPerformers
                        .filter(item => item.coverage > 0)
                        .sort((a, b) => b.coverage - a.coverage)
                        .slice(0, 5)
                        .map(item => ({
                          name: item.name,
                          value: item.coverage,
                          label: `${item.coverage}%`,
                          href: "#",
                          color: "var(--color-blue-500)",
                        }))}
                      valueFormatter={(value) => `${value}%`}
                    />
                  </TabsContent>
                  <TabsContent value="reports" className="pt-4">
                    <BarList
                      data={topPerformers
                        .sort((a, b) => b.reports - a.reports)
                        .slice(0, 5)
                        .map(item => ({
                          name: item.name,
                          value: item.reports,
                          label: `${item.reports} reports`,
                          href: "#",
                          color: "var(--color-green-500)",
                        }))}
                      valueFormatter={(value) => `${value}`}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                <Users className="h-12 w-12 mb-2 opacity-30" />
                <p>No performer data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CHDashboard;
