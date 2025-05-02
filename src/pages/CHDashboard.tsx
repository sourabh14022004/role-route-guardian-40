
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { fetchDashboardStats, fetchBranchCategoryStats, fetchMonthlyTrends, fetchTopPerformers } from "@/services/chService";
import { Building, CheckCircle, PieChart, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatCard = ({ 
  title, 
  value, 
  icon, 
  change, 
  suffix = "",
  isLoading = false,
  gradientClass = "from-blue-500 to-blue-600"
}: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode; 
  change?: number;
  suffix?: string;
  isLoading?: boolean;
  gradientClass?: string;
}) => {
  return (
    <Card className="transition-all hover:shadow-lg hover:translate-y-[-2px] duration-300">
      <CardContent className="p-6 bg-gradient-to-br rounded-lg overflow-hidden relative">
        <div className={`absolute inset-0 opacity-90 bg-gradient-to-br ${gradientClass}`} />
        <div className="relative z-10">
          <div className="text-white text-sm mb-1 font-medium opacity-90">{title}</div>
          <div className="flex items-end justify-between">
            <div className="flex items-end gap-1">
              {isLoading ? (
                <div className="h-4 bg-white/20 rounded animate-pulse w-16"></div>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">{value}</span>
                  {suffix && <span className="text-2xl mb-1 text-white/90">{suffix}</span>}
                </>
              )}
            </div>
            <div className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm">
              {icon}
            </div>
          </div>
          {typeof change === 'number' && (
            <div className="mt-3 flex items-center text-sm">
              {isLoading ? (
                <div className="h-3 bg-white/20 rounded animate-pulse w-20"></div>
              ) : change > 0 ? (
                <div className="flex items-center bg-green-500/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{change}%
                </div>
              ) : change < 0 ? (
                <div className="flex items-center bg-red-500/20 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {change}%
                </div>
              ) : (
                <div className="flex items-center bg-white/10 backdrop-blur-sm text-white px-2 py-0.5 rounded">
                  <Minus className="h-3 w-3 mr-1" />
                  {change}%
                </div>
              )}
              <span className="ml-2 text-white/80">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingUI = () => (
  <div className="flex justify-center py-8">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const ErrorUI = ({ message }: { message: string }) => (
  <div className="py-4 text-center">
    <div className="inline-flex items-center justify-center bg-red-50 p-2 rounded-full text-red-500 mb-3">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
    </div>
    <p className="text-slate-600">{message}</p>
    <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
      Retry
    </Button>
  </div>
);

const CHDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['ch-dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  const { data: categoryStats, isLoading: categoryLoading, isError: categoryError } = useQuery({
    queryKey: ['ch-branch-category-stats'],
    queryFn: fetchBranchCategoryStats
  });

  const { data: monthlyTrends, isLoading: trendsLoading, isError: trendsError } = useQuery({
    queryKey: ['ch-monthly-trends'],
    queryFn: fetchMonthlyTrends
  });

  const { data: topPerformers, isLoading: performersLoading, isError: performersError } = useQuery({
    queryKey: ['ch-top-performers'],
    queryFn: fetchTopPerformers
  });

  const getProgressColorClass = (value: number) => {
    if (value >= 90) return "bg-gradient-to-r from-green-400 to-green-600";
    if (value >= 75) return "bg-gradient-to-r from-blue-400 to-blue-600";
    if (value >= 50) return "bg-gradient-to-r from-amber-400 to-amber-600";
    return "bg-gradient-to-r from-red-400 to-red-600";
  };

  const handleGenerateReports = () => {
    navigate('/ch/reports');
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center mb-8">
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Welcome, Channel HR User</h1>
          <p className="text-slate-600 mt-1">Channel-wide HR analytics and branch visit reports</p>
        </div>
        <Button 
          onClick={handleGenerateReports}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
        >
          Generate Reports
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        <StatCard
          title="Total Branches"
          value={statsLoading ? "..." : stats?.totalBranches || 0}
          icon={<Building className="h-5 w-5" />}
          isLoading={statsLoading}
          gradientClass="from-blue-500 to-indigo-600"
        />
        
        <StatCard
          title="Total Visits"
          value={statsLoading ? "..." : stats?.visitedBranches || 0}
          icon={<CheckCircle className="h-5 w-5" />}
          isLoading={statsLoading}
          gradientClass="from-emerald-500 to-green-600"
        />
        
        <StatCard
          title="Coverage"
          value={statsLoading ? "..." : stats?.coverage || 0}
          icon={<PieChart className="h-5 w-5" />}
          change={stats?.vsLastMonth?.coverage}
          suffix="%"
          isLoading={statsLoading}
          gradientClass="from-purple-500 to-violet-600"
        />
        
        <StatCard
          title="Active BHRs"
          value={statsLoading ? "..." : stats?.activeBHRs || 0}
          icon={<Users className="h-5 w-5" />}
          isLoading={statsLoading}
          gradientClass="from-amber-500 to-orange-600"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        <StatCard
          title="Avg. Coverage"
          value={statsLoading ? "..." : stats?.avgCoverage || 0}
          icon={<PieChart className="h-5 w-5" />}
          change={stats?.vsLastMonth?.avgCoverage}
          suffix="%"
          isLoading={statsLoading}
          gradientClass="from-pink-500 to-rose-600"
        />
        
        <StatCard
          title="Attrition"
          value={statsLoading ? "..." : stats?.attritionRate || 0}
          icon={<TrendingDown className="h-5 w-5" />}
          change={stats?.vsLastMonth?.attritionRate}
          suffix="%"
          isLoading={statsLoading}
          gradientClass="from-red-500 to-rose-600"
        />
        
        <StatCard
          title="Manning %"
          value={statsLoading ? "..." : stats?.manningPercentage || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          change={stats?.vsLastMonth?.manningPercentage}
          suffix="%"
          isLoading={statsLoading}
          gradientClass="from-teal-500 to-emerald-600"
        />
        
        <StatCard
          title="ER %"
          value={statsLoading ? "..." : stats?.erPercentage || 0}
          icon={<TrendingUp className="h-5 w-5" />}
          change={stats?.vsLastMonth?.erPercentage}
          suffix="%"
          isLoading={statsLoading}
          gradientClass="from-cyan-500 to-blue-600"
        />
      </div>

      {/* Branch Visit Coverage by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Branch Visit Coverage by Category</h2>
            <div className="mt-1 text-sm font-medium text-slate-500">Current Month</div>
          </div>
          
          <div className="p-6 space-y-6">
            {categoryLoading ? (
              <LoadingUI />
            ) : categoryError ? (
              <ErrorUI message="Failed to load category data" />
            ) : !categoryStats || categoryStats.length === 0 ? (
              <div className="py-4 text-center text-slate-500">
                No category data available
              </div>
            ) : (
              <>
                {categoryStats.map((category, index) => (
                  <div key={index} className="space-y-3 hover:bg-slate-50 p-3 rounded-lg transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="capitalize font-medium text-slate-700">{category.category}</span>
                      <span className="text-slate-600 font-medium">{category.visited}/{category.total} branches</span>
                    </div>
                    <div className="h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${getProgressColorClass(category.coverage)} rounded-full transition-all duration-500 ease-in-out shadow-sm`} 
                        style={{ width: `${category.coverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* Monthly Trend and Top Performers */}
        <div className="bg-white rounded-xl border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="p-6 border-b bg-gradient-to-r from-slate-50 to-slate-100">
            <h2 className="text-xl font-bold text-slate-800">Monthly Trend</h2>
          </div>
          
          <div className="px-6 pt-6">
            {trendsLoading ? (
              <LoadingUI />
            ) : trendsError ? (
              <div className="py-4 text-center text-slate-500">
                Failed to load trend data
              </div>
            ) : !monthlyTrends || monthlyTrends.length === 0 ? (
              <div className="py-4 text-center text-slate-500">
                No trend data available
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyTrends.map((month, i) => (
                  <div key={i} className="flex items-center gap-3 group hover:bg-slate-50 p-2 rounded-md transition-all duration-300">
                    <div className="w-28 text-slate-700 font-medium">{month.month}</div>
                    <div className="flex-1 h-3 rounded-full bg-slate-200 overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${
                          month.branchCoverage >= 75 
                          ? "bg-gradient-to-r from-green-400 to-green-600" 
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                        } rounded-full transition-all duration-500 ease-in-out group-hover:opacity-95`}
                        style={{ width: `${month.branchCoverage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-6 border-t mt-6 bg-gradient-to-r from-slate-50 to-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">Top Performers</h3>
              <span className="text-xs font-medium bg-blue-50 text-blue-700 rounded-full px-3 py-1 shadow-sm">This Month</span>
            </div>
            
            {performersLoading ? (
              <LoadingUI />
            ) : performersError ? (
              <div className="py-4 text-center text-slate-500">
                Failed to load performer data
              </div>
            ) : !topPerformers || topPerformers.length === 0 ? (
              <div className="py-4 text-center text-slate-500">
                No performer data available
              </div>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((performer, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                    <span className="text-sm font-medium text-slate-800">
                      {`${performer.e_code || 'BHR'} - ${performer.name}`}
                    </span>
                    <span className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-700 shadow-sm">
                      {performer.reports} reports
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CHDashboard;
