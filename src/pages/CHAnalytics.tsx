
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Calendar } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Bar, BarChart, Legend, Rectangle, Cell } from "recharts";
import { fetchAnalyticsData } from "@/services/chService";
import { useQuery } from "@tanstack/react-query";

// Metric card component for displaying stats
const MetricCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  suffix = "" 
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  change?: number;
  suffix?: string;
}) => {
  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="text-slate-500 text-sm mb-1">{title}</div>
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold">{value}</span>
            {suffix && <span className="text-2xl mb-1 text-slate-600">{suffix}</span>}
          </div>
          <div className="bg-blue-50 p-2 rounded-full text-blue-600">
            {icon}
          </div>
        </div>
        {typeof change === 'number' && (
          <div className="mt-3 flex items-center text-sm">
            {change > 0 ? (
              <div className="flex items-center bg-green-50 text-green-600 px-2 py-0.5 rounded">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +{change}%
              </div>
            ) : (
              <div className="flex items-center bg-red-50 text-red-600 px-2 py-0.5 rounded">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                {change}%
              </div>
            )}
            <span className="ml-2 text-slate-500">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Parameter card with progress bar
const ParameterCard = ({ 
  label, 
  value,
  maxValue = 100
}: { 
  label: string; 
  value: number;
  maxValue?: number;
}) => {
  const getProgressColor = (val: number) => {
    if (val >= 90) return "bg-blue-500";
    if (val >= 75) return "bg-blue-500";
    if (val >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor(value)} transition-all duration-500`} 
          style={{ width: `${(value / maxValue) * 100}%` }}
        />
      </div>
    </div>
  );
};

const PerformerCard = ({ 
  title, 
  name, 
  description 
}: { 
  title: string; 
  name: string; 
  description: string;
}) => {
  return (
    <Card className="bg-green-50 border-green-200">
      <CardContent className="p-6">
        <h3 className="text-green-800 font-medium mb-2">{title}</h3>
        <div className="text-xl font-semibold text-green-900 mb-1">{name}</div>
        <p className="text-green-700">{description}</p>
      </CardContent>
    </Card>
  );
};

// Different metrics that could be visualized
const METRICS = [
  { id: "branchCoverage", label: "Branch Coverage %" },
  { id: "manningPercentage", label: "Manning %" },
  { id: "attritionRate", label: "Attrition Rate" },
  { id: "participationRate", label: "Participation %" },
  { id: "nonVendorPercentage", label: "Non-Vendor %" },
];

// Monthly trend data for the charts
const MONTHLY_DATA = [
  { month: "Jan", branchCoverage: 65, manningPercentage: 75, attritionRate: 14, participationRate: 60, nonVendorPercentage: 70 },
  { month: "Feb", branchCoverage: 68, manningPercentage: 78, attritionRate: 13, participationRate: 65, nonVendorPercentage: 72 },
  { month: "Mar", branchCoverage: 70, manningPercentage: 82, attritionRate: 12, participationRate: 68, nonVendorPercentage: 74 },
  { month: "Apr", branchCoverage: 73, manningPercentage: 85, attritionRate: 11, participationRate: 72, nonVendorPercentage: 76 },
  { month: "May", branchCoverage: 76, manningPercentage: 88, attritionRate: 10, participationRate: 75, nonVendorPercentage: 77 },
  { month: "Jun", branchCoverage: 80, manningPercentage: 90, attritionRate: 9, participationRate: 78, nonVendorPercentage: 79 },
];

// Category data for the bar chart
const CATEGORY_DATA = [
  { name: "Platinum", total: 15, visited: 15 },
  { name: "Diamond", total: 22, visited: 20 },
  { name: "Gold", total: 35, visited: 30 },
  { name: "Silver", total: 28, visited: 15 },
  { name: "Bronze", total: 20, visited: 7 },
];

const CHAnalytics = () => {
  const [selectedMetric, setSelectedMetric] = useState("branchCoverage");
  const [selectedMonth, setSelectedMonth] = useState("May");
  const [selectedYear, setSelectedYear] = useState("2026");

  const { data, isLoading } = useQuery({
    queryKey: ['ch-analytics', selectedMonth, selectedYear],
    queryFn: () => fetchAnalyticsData(selectedMonth, selectedYear)
  });

  // Colors for the charts and UI elements
  const colors = {
    blue: "#0ea5e9",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    gray: "#94a3b8",
  };

  const getColorByCategory = (category: string) => {
    switch (category.toLowerCase()) {
      case "platinum": return colors.blue;
      case "diamond": return colors.green;
      case "gold": return colors.amber;
      case "silver": return colors.gray;
      case "bronze": return colors.red;
      default: return colors.blue;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Analytics Dashboard</h1>
        <p className="text-slate-600">Comprehensive view of branch visit performance</p>
      </div>

      {/* Date Selector */}
      <div className="flex gap-4 mb-6 items-center">
        <div className="flex items-center bg-white border rounded-lg p-2">
          <Calendar className="h-5 w-5 text-slate-500 mr-2" />
          <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="border-0 p-0 h-auto w-20 text-base focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month) => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="border-0 p-0 h-auto w-16 text-base focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["2025", "2026", "2027"].map((year) => (
                <SelectItem key={year} value={year}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <MetricCard
          title="Branch Visit Coverage"
          value={data?.branchVisitCoverage || 0}
          icon={<Calendar className="h-5 w-5" />}
          change={data?.vsLastMonth?.branchVisitCoverage}
          suffix="%"
        />
        
        <MetricCard
          title="Employee Participation"
          value={data?.employeeParticipation || 0}
          icon={<Calendar className="h-5 w-5" />}
          change={data?.vsLastMonth?.employeeParticipation}
          suffix="%"
        />
        
        <MetricCard
          title="Active BHRs"
          value={data ? `${data.activeBHRs.active}/${data.activeBHRs.total}` : "0"}
          icon={<Calendar className="h-5 w-5" />}
        />
        
        <MetricCard
          title="Attrition Rate"
          value={data?.attritionRate || 0}
          icon={<Calendar className="h-5 w-5" />}
          change={data?.vsLastMonth?.attritionRate}
          suffix="%"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Branch Category Coverage */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1 flex items-center justify-between">
              Branch Category Coverage
              <span className="text-sm font-medium bg-slate-100 rounded px-2 py-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {selectedMonth} {selectedYear}
              </span>
            </h2>
            <div className="mt-6 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={CATEGORY_DATA}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded-md shadow-lg">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm text-slate-600">Total: {data.total} branches</p>
                            <p className="text-sm text-blue-600">Visited: {data.visited} branches</p>
                            <p className="text-sm text-green-600">
                              Coverage: {Math.round((data.visited / data.total) * 100)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="total"
                    fill="#cbd5e1"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  />
                  <Bar
                    dataKey="visited"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    barSize={30}
                  >
                    {CATEGORY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorByCategory(entry.name)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Monthly Trend</h2>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">Metric:</span>
                <Select defaultValue={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METRICS.map((metric) => (
                      <SelectItem key={metric.id} value={metric.id}>{metric.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={MONTHLY_DATA}
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const metricValue = data[selectedMetric];
                        const metricLabel = METRICS.find(m => m.id === selectedMetric)?.label || selectedMetric;
                        
                        return (
                          <div className="bg-white p-3 border rounded-md shadow-lg">
                            <p className="font-medium">{data.month}</p>
                            <p className="text-sm text-blue-600">{metricLabel}: {metricValue}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ r: 6, strokeWidth: 2, fill: "#fff" }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Metrics Breakdown */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Key Metrics Breakdown</h2>
            
            {/* HR Parameters */}
            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4 text-slate-700">HR Parameters</h3>
              <div className="space-y-6">
                <ParameterCard
                  label="Manning Percentage"
                  value={data?.hrParameters?.manningPercentage || 0}
                />
                <ParameterCard
                  label="Non-Vendor Percentage"
                  value={data?.hrParameters?.nonVendorPercentage || 0}
                />
                <ParameterCard
                  label="Employee Coverage"
                  value={data?.hrParameters?.employeeCoverage || 0}
                />
                <ParameterCard
                  label="New Employee Coverage"
                  value={data?.hrParameters?.newEmployeeCoverage || 0}
                />
              </div>
            </div>
            
            {/* Performance Indicators and Source Mix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4 text-slate-400 uppercase text-xs tracking-wide">Performance Indicators</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">AVG. ATTRITION</div>
                    <div className="text-3xl font-bold">{data?.performanceIndicators?.avgAttrition || 0}%</div>
                    <div className="mt-1 text-sm text-green-600">
                      Down {data?.vsLastMonth?.attritionRate?.toString().replace("-", "")}% from last month
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-xs text-slate-500 mb-1">CWT CASES</div>
                    <div className="text-3xl font-bold">{data?.performanceIndicators?.cwtCases || 0}</div>
                    <div className="mt-1 text-sm text-red-600">
                      Down 5% from last month
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4 text-slate-400 uppercase text-xs tracking-wide">Source Mix</h3>
                <div className="flex items-center">
                  <div className="w-full h-3 flex rounded-full overflow-hidden">
                    {data?.sourceMix?.map((source, i) => (
                      <div
                        key={source.name}
                        className={`h-full ${
                          i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : "bg-orange-500"
                        }`}
                        style={{ width: `${source.value}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  {data?.sourceMix?.map((source, i) => (
                    <div key={source.name} className="flex items-center mt-2">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          i === 0 ? "bg-blue-500" : i === 1 ? "bg-green-500" : "bg-orange-500"
                        }`}
                      />
                      <span className="text-sm">
                        {source.name} ({source.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Top Performers</h2>
          
          <PerformerCard
            title="Top BHR"
            name={data?.topPerformers?.bhr.name || ""}
            description={`${data?.topPerformers?.bhr.coverage || 0}% branch visit coverage`}
          />
          
          <PerformerCard
            title="Top Branch Category"
            name={data?.topPerformers?.category.name || ""}
            description={`${data?.topPerformers?.category.rate || 0}% visit completion rate`}
          />
          
          <PerformerCard
            title="Top Location"
            name={data?.topPerformers?.location.name || ""}
            description={`${data?.topPerformers?.location.coverage || 0}% average coverage`}
          />
          
          <PerformerCard
            title="Most Improved"
            name={data?.topPerformers?.mostImproved.name || ""}
            description={`+${data?.topPerformers?.mostImproved.improvement || 0}% improvement from last month`}
          />
        </div>
      </div>
    </div>
  );
};

export default CHAnalytics;
