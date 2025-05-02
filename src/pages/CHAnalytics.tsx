
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, ArrowDownRight, Calendar, ChevronDown } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  CartesianGrid, 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Bar, 
  BarChart, 
  Legend, 
  Cell,
  PieChart,
  Pie,
  Sector
} from "recharts";
import { fetchAnalyticsData, fetchMonthlyTrends } from "@/services/chService";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

// Time range options for trend deck
const TIME_RANGES = [
  { id: "7d", label: "Last 7 Days" },
  { id: "15d", label: "Last 15 Days" },
  { id: "1m", label: "Last Month" },
  { id: "3m", label: "Last 3 Months" },
  { id: "6m", label: "Last 6 Months" },
  { id: "1y", label: "Last Year" },
  { id: "3y", label: "Last 3 Years" },
  { id: "custom", label: "Custom Range" },
];

// Helper function for pie chart active shape
const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-medium">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">{`${value} branches`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const CHAnalytics = () => {
  // Get current date for default values
  const currentDate = new Date();
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear().toString();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTimeRange, setSelectedTimeRange] = useState("1m");
  const [activeMetrics, setActiveMetrics] = useState<string[]>(["branchCoverage"]);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate()),
    to: currentDate
  });
  const [activePieIndex, setActivePieIndex] = useState(0);

  // Query for main analytics data
  const { data, isLoading } = useQuery({
    queryKey: ['ch-analytics', selectedMonth, selectedYear],
    queryFn: () => fetchAnalyticsData(selectedMonth, selectedYear)
  });

  // Query for trend data with selected time range
  const { data: trendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ['ch-trends', selectedTimeRange, dateRange],
    queryFn: () => fetchMonthlyTrends()
  });

  // Handle time range change
  useEffect(() => {
    if (selectedTimeRange === "custom") {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
      // Set date range based on selected time range
      const to = new Date();
      let from = new Date();
      
      switch (selectedTimeRange) {
        case "7d":
          from.setDate(from.getDate() - 7);
          break;
        case "15d":
          from.setDate(from.getDate() - 15);
          break;
        case "1m":
          from.setMonth(from.getMonth() - 1);
          break;
        case "3m":
          from.setMonth(from.getMonth() - 3);
          break;
        case "6m":
          from.setMonth(from.getMonth() - 6);
          break;
        case "1y":
          from.setFullYear(from.getFullYear() - 1);
          break;
        case "3y":
          from.setFullYear(from.getFullYear() - 3);
          break;
      }
      
      setDateRange({ from, to });
    }
  }, [selectedTimeRange]);

  // Format category data for pie chart
  const categoryPieData = data?.categoryBreakdown?.map(cat => ({
    name: cat.name,
    value: cat.branches
  })) || [];

  // Colors for the charts and UI elements
  const colors = {
    blue: "#0ea5e9",
    green: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    gray: "#94a3b8",
    purple: "#a855f7",
    pink: "#ec4899",
    indigo: "#6366f1",
    teal: "#14b8a6",
  };

  // Get color for pie chart categories
  const getCategoryColor = (index: number) => {
    const colorsList = [colors.blue, colors.green, colors.amber, colors.red, colors.purple];
    return colorsList[index % colorsList.length];
  };

  // Toggle metric selection
  const toggleMetric = (metricId: string) => {
    setActiveMetrics(currentMetrics => 
      currentMetrics.includes(metricId)
        ? currentMetrics.filter(id => id !== metricId)
        : [...currentMetrics, metricId]
    );
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
        <div className="flex items-center bg-white border rounded-lg p-2 shadow-sm">
          <Calendar className="h-5 w-5 text-slate-500 mr-2" />
          <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="border-0 p-0 h-auto w-24 text-base focus:ring-0">
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
        {/* Branch Category Coverage - Now with Pie Chart */}
        <Card className="shadow-md border-slate-200">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-1 flex items-center justify-between">
              Branch Category Coverage
              <span className="text-sm font-medium bg-slate-100 rounded px-2 py-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                {selectedMonth} {selectedYear}
              </span>
            </h2>
            <div className="mt-6 h-80 flex justify-center items-center">
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={categoryPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getCategoryColor(index)} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500">No category data available</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Trend Deck - Enhanced from Monthly Trend */}
        <Card className="shadow-md border-slate-200">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Trend Deck</h2>
              <div className="flex flex-wrap gap-3 items-center mt-2 sm:mt-0">
                {/* Time range selector */}
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_RANGES.map((range) => (
                      <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Metrics selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1">
                      Metrics
                      <ChevronDown className="h-4 w-4 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {METRICS.map((metric) => (
                      <DropdownMenuCheckboxItem
                        key={metric.id}
                        checked={activeMetrics.includes(metric.id)}
                        onCheckedChange={() => toggleMetric(metric.id)}
                      >
                        {metric.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {/* Custom date range picker if selected */}
            {showCustomRange && (
              <div className="mb-4">
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            )}

            <div className="h-80">
              {activeMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendsData || []}
                    margin={{ top: 5, right: 20, bottom: 25, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 border rounded-md shadow-lg">
                              <p className="font-medium">{payload[0].payload.month}</p>
                              {payload.map((entry, index) => (
                                <p key={`metric-${index}`} className="text-sm" style={{ color: entry.color }}>
                                  {METRICS.find(m => m.id === entry.dataKey)?.label || entry.dataKey}: {entry.value}%
                                </p>
                              ))}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        const metric = METRICS.find(m => m.id === value);
                        return metric ? metric.label : value;
                      }} 
                    />
                    {activeMetrics.map((metricId, index) => (
                      <Line
                        key={metricId}
                        type="monotone"
                        dataKey={metricId}
                        stroke={Object.values(colors)[index % Object.values(colors).length]}
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 1, fill: "#fff" }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Please select at least one metric to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Key Metrics Breakdown */}
        <Card className="shadow-md border-slate-200">
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
