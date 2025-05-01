import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type BranchVisit = Database['public']['Tables']['branch_visits']['Row'];
type Branch = Database['public']['Tables']['branches']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export interface BranchCategoryStats {
  category: string;
  total: number;
  visited: number;
  coverage: number;
}

export interface MonthlyStats {
  month: string;
  branchCoverage: number;
  participationRate?: number;
}

export interface BHRPerformance {
  id: string;
  name: string;
  coverage: number;
  reports: number;
  e_code?: string;
}

interface DashboardStats {
  totalBranches: number;
  visitedBranches: number;
  coverage: number;
  activeBHRs: number;
  avgCoverage: number;
  attritionRate: number;
  manningPercentage: number;
  erPercentage: number;
  vsLastMonth: {
    coverage: number;
    avgCoverage: number;
    attritionRate: number;
    manningPercentage: number;
    erPercentage: number;
  };
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total branches
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });

    if (branchError) throw branchError;

    // Get all branch visits for calculations
    const { data: allVisits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, visit_date, manning_percentage, attrition_percentage, er_percentage')
      .eq('status', 'approved');

    if (visitsError) throw visitsError;

    // Handle case where no visits are found
    if (!allVisits) {
      return {
        totalBranches: totalBranches || 0,
        visitedBranches: 0,
        coverage: 0,
        activeBHRs: 0,
        avgCoverage: 0,
        attritionRate: 0,
        manningPercentage: 0,
        erPercentage: 0,
        vsLastMonth: {
          coverage: 0,
          avgCoverage: 0,
          attritionRate: 0,
          manningPercentage: 0,
          erPercentage: 0
        }
      };
    }

    // Count unique visited branches
    const visitedBranchIds = new Set(allVisits.map(v => v.branch_id));
    const visitedBranchesCount = visitedBranchIds.size;

    // Get active BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH');

    if (bhrError) throw bhrError;

    // Get recent visits for metrics (within last 30 days)
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    
    const { data: recentVisits, error: recentError } = await supabase
      .from('branch_visits')
      .select('*')
      .gte('visit_date', lastMonthDate.toISOString())
      .eq('status', 'approved');

    if (recentError) throw recentError;

    const currentVisits = recentVisits || [];
    
    // Get data for previous month (30-60 days ago) to compare
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const { data: previousVisits, error: previousError } = await supabase
      .from('branch_visits')
      .select('branch_id, manning_percentage, attrition_percentage, er_percentage')
      .gte('visit_date', twoMonthsAgo.toISOString())
      .lt('visit_date', lastMonthDate.toISOString())
      .eq('status', 'approved');
    
    if (previousError) throw previousError;

    // Calculate current month averages
    const manningSum = currentVisits.reduce((sum, visit) => {
      return sum + (typeof visit.manning_percentage === 'number' ? visit.manning_percentage : 0);
    }, 0);
    
    const attritionSum = currentVisits.reduce((sum, visit) => {
      return sum + (typeof visit.attrition_percentage === 'number' ? visit.attrition_percentage : 0);
    }, 0);
    
    const erSum = currentVisits.reduce((sum, visit) => {
      return sum + (typeof visit.er_percentage === 'number' ? visit.er_percentage : 0);
    }, 0);
    
    const visitCount = currentVisits.length || 1; // Avoid division by zero
    
    // Calculate previous month averages
    const prevVisits = previousVisits || [];
    const prevVisitCount = prevVisits.length || 1;
    
    const prevManningSum = prevVisits.reduce((sum, visit) => {
      return sum + (typeof visit.manning_percentage === 'number' ? visit.manning_percentage : 0);
    }, 0);
    
    const prevAttritionSum = prevVisits.reduce((sum, visit) => {
      return sum + (typeof visit.attrition_percentage === 'number' ? visit.attrition_percentage : 0);
    }, 0);
    
    const prevErSum = prevVisits.reduce((sum, visit) => {
      return sum + (typeof visit.er_percentage === 'number' ? visit.er_percentage : 0);
    }, 0);

    // Calculate month-over-month changes
    const prevManningAvg = Math.round(prevManningSum / prevVisitCount);
    const prevAttritionAvg = Math.round(prevAttritionSum / prevVisitCount);
    const prevErAvg = Math.round(prevErSum / prevVisitCount);
    
    // Get previous month unique branch visits
    const prevVisitedBranchIds = new Set(prevVisits.map(v => v.branch_id));
    const prevCoverage = totalBranches ? Math.round((prevVisitedBranchIds.size / totalBranches) * 100) : 0;
    
    const currentManningAvg = Math.round(manningSum / visitCount);
    const currentAttritionAvg = Math.round(attritionSum / visitCount);
    const currentErAvg = Math.round(erSum / visitCount);
    const currentCoverage = totalBranches ? Math.round((visitedBranchesCount / totalBranches) * 100) : 0;
    
    // Calculate percentage changes
    const coverageChange = currentCoverage - prevCoverage;
    const manningChange = currentManningAvg - prevManningAvg;
    const attritionChange = currentAttritionAvg - prevAttritionAvg;
    const erChange = currentErAvg - prevErAvg;

    return {
      totalBranches: totalBranches || 0,
      visitedBranches: visitedBranchesCount,
      coverage: currentCoverage,
      activeBHRs: (bhrs || []).length,
      avgCoverage: currentCoverage, // Using the same coverage for now
      attritionRate: currentAttritionAvg,
      manningPercentage: currentManningAvg,
      erPercentage: currentErAvg,
      vsLastMonth: {
        coverage: coverageChange,
        avgCoverage: coverageChange, // Using the same change
        attritionRate: attritionChange,
        manningPercentage: manningChange,
        erPercentage: erChange
      }
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading dashboard statistics",
      description: error.message || "An unexpected error occurred"
    });
    
    // Return default values on error so the UI doesn't break
    return {
      totalBranches: 0,
      visitedBranches: 0,
      coverage: 0,
      activeBHRs: 0,
      avgCoverage: 0,
      attritionRate: 0,
      manningPercentage: 0,
      erPercentage: 0,
      vsLastMonth: {
        coverage: 0,
        avgCoverage: 0,
        attritionRate: 0,
        manningPercentage: 0,
        erPercentage: 0
      }
    };
  }
}

export async function fetchBranchCategoryStats(): Promise<BranchCategoryStats[]> {
  try {
    // Get all branches with their categories
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, category');
    
    if (branchError) throw branchError;

    if (!branches || branches.length === 0) {
      return [];
    }

    // Get all approved branch visits
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .eq('status', 'approved');
    
    if (visitError) throw visitError;

    // Create a set of visited branch IDs for quick lookup
    const visitedBranchIds = new Set((visits || []).map(visit => visit.branch_id));

    // Count by category
    const categoryStats: Record<string, { total: number, visited: number }> = {
      'platinum': { total: 0, visited: 0 },
      'diamond': { total: 0, visited: 0 },
      'gold': { total: 0, visited: 0 },
      'silver': { total: 0, visited: 0 },
      'bronze': { total: 0, visited: 0 }
    };

    branches.forEach(branch => {
      if (!branch.category) return;
      
      const category = branch.category.toLowerCase();
      if (categoryStats[category]) {
        categoryStats[category].total++;
        if (visitedBranchIds.has(branch.id)) {
          categoryStats[category].visited++;
        }
      }
    });

    // Format the results
    return Object.entries(categoryStats).map(([category, stats]) => ({
      category,
      total: stats.total,
      visited: stats.visited,
      coverage: stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0
    }));
  } catch (error: any) {
    console.error("Error fetching branch category stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading category statistics",
      description: error.message || "An unexpected error occurred"
    });
    return [];
  }
}

export async function fetchMonthlyTrends(): Promise<MonthlyStats[]> {
  try {
    // Get visits for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1); // Start from first day of that month
    
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id, visit_date, total_employees_invited, total_participants')
      .gte('visit_date', sixMonthsAgo.toISOString())
      .eq('status', 'approved')
      .order('visit_date', { ascending: false });
    
    if (visitError) throw visitError;
    
    if (!visits || visits.length === 0) {
      // Return empty data with month names as fallback
      const monthNames = [];
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        monthNames.unshift(d.toLocaleString('default', { month: 'long' }));
      }
      return monthNames.map(month => ({
        month,
        branchCoverage: 0,
        participationRate: 0
      }));
    }
    
    // Get total branches count
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });
    
    if (branchError) throw branchError;
    
    // Group visits by month
    const visitsByMonth: Record<string, {
      branchIds: Set<string>;
      totalInvited: number;
      totalParticipated: number;
    }> = {};
    
    visits.forEach(visit => {
      if (!visit.visit_date) return;
      
      const visitDate = new Date(visit.visit_date);
      const monthKey = `${visitDate.getFullYear()}-${visitDate.getMonth() + 1}`;
      
      if (!visitsByMonth[monthKey]) {
        visitsByMonth[monthKey] = {
          branchIds: new Set(),
          totalInvited: 0,
          totalParticipated: 0
        };
      }
      
      visitsByMonth[monthKey].branchIds.add(visit.branch_id);
      
      // Add participation data if available
      if (typeof visit.total_employees_invited === 'number') {
        visitsByMonth[monthKey].totalInvited += visit.total_employees_invited;
      }
      
      if (typeof visit.total_participants === 'number') {
        visitsByMonth[monthKey].totalParticipated += visit.total_participants;
      }
    });
    
    // Format the results
    const monthlyData: MonthlyStats[] = [];
    
    // Get last 6 month names
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const monthName = d.toLocaleString('default', { month: 'long' });
      
      months.unshift({
        key: monthKey,
        name: monthName
      });
    }
    
    months.forEach(({ key, name }) => {
      const monthData = visitsByMonth[key];
      
      if (monthData) {
        const branchCoverage = totalBranches ? 
          Math.round((monthData.branchIds.size / totalBranches) * 100) : 0;
          
        const participationRate = monthData.totalInvited > 0 ? 
          Math.round((monthData.totalParticipated / monthData.totalInvited) * 100) : 0;
          
        monthlyData.push({
          month: name,
          branchCoverage,
          participationRate
        });
      } else {
        // No data for this month
        monthlyData.push({
          month: name,
          branchCoverage: 0,
          participationRate: 0
        });
      }
    });
    
    return monthlyData;
  } catch (error: any) {
    console.error("Error fetching monthly trends:", error);
    toast({
      variant: "destructive",
      title: "Error loading monthly trends",
      description: error.message || "An unexpected error occurred"
    });
    
    // Return empty data with month names as fallback
    const monthNames = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      monthNames.unshift(d.toLocaleString('default', { month: 'long' }));
    }
    return monthNames.map(month => ({
      month,
      branchCoverage: 0
    }));
  }
}

export async function fetchTopPerformers(): Promise<BHRPerformance[]> {
  try {
    // Get all BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id, full_name, e_code')
      .eq('role', 'BH');
    
    if (bhrError) throw bhrError;
    
    if (!bhrs || bhrs.length === 0) {
      return [];
    }

    // Get branch assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('branch_assignments')
      .select('user_id, branch_id');
    
    if (assignmentError) throw assignmentError;

    // Get branch visits for the current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('user_id, branch_id')
      .gte('visit_date', startOfMonth.toISOString())
      .eq('status', 'approved');
    
    if (visitError) throw visitError;

    // Group assignments by BHR
    const bhrAssignments: Record<string, Set<string>> = {};
    (assignments || []).forEach(assignment => {
      if (!assignment.user_id) return;
      
      if (!bhrAssignments[assignment.user_id]) {
        bhrAssignments[assignment.user_id] = new Set();
      }
      if (assignment.branch_id) {
        bhrAssignments[assignment.user_id].add(assignment.branch_id);
      }
    });

    // Count visits by BHR
    const bhrVisits: Record<string, Set<string>> = {};
    (visits || []).forEach(visit => {
      if (!visit.user_id) return;
      
      if (!bhrVisits[visit.user_id]) {
        bhrVisits[visit.user_id] = new Set();
      }
      if (visit.branch_id) {
        bhrVisits[visit.user_id].add(visit.branch_id);
      }
    });

    // Calculate coverage and reports for each BHR
    const performers = bhrs.map(bhr => {
      const assignedBranches = bhrAssignments[bhr.id] || new Set();
      const visitedBranches = bhrVisits[bhr.id] || new Set();
      
      return {
        id: bhr.id,
        name: bhr.full_name || 'Unknown BHR',
        e_code: bhr.e_code,
        reports: visitedBranches.size,
        coverage: assignedBranches.size > 0 
          ? Math.round((visitedBranches.size / assignedBranches.size) * 100) 
          : 0
      };
    });

    // Sort by number of reports first (since that's what the user requested)
    return performers.sort((a, b) => {
      if (b.reports !== a.reports) return b.reports - a.reports;
      return b.coverage - a.coverage;
    }).slice(0, 3); // Return top 3
  } catch (error: any) {
    console.error("Error fetching top performers:", error);
    toast({
      variant: "destructive",
      title: "Error loading top performers",
      description: error.message || "An unexpected error occurred"
    });
    return [];
  }
}

// Keep existing functions for analytics and reports data
export async function fetchAnalyticsData(month?: string, year?: string) {
  // This would fetch analytics data based on month/year
  // For now, returning mock data
  return {
    branchVisitCoverage: 87,
    employeeParticipation: 71,
    activeBHRs: { active: 10, total: 15 },
    attritionRate: 12,
    vsLastMonth: {
      branchVisitCoverage: 5,
      employeeParticipation: 3,
      attritionRate: -2
    },
    hrParameters: {
      manningPercentage: 92,
      nonVendorPercentage: 78,
      employeeCoverage: 85,
      newEmployeeCoverage: 92
    },
    performanceIndicators: {
      avgAttrition: 12,
      cwtCases: 28
    },
    sourceMix: [
      { name: 'Direct', value: 45 },
      { name: 'Referral', value: 30 },
      { name: 'Agency', value: 25 }
    ],
    topPerformers: {
      bhr: { name: 'Vikram Malhotra', coverage: 100 },
      category: { name: 'Platinum', rate: 100 },
      location: { name: 'Mumbai', coverage: 94 },
      mostImproved: { name: 'Silver Category', improvement: 15 }
    }
  };
}

export async function fetchCategoryBreakdown() {
  // This would be a real database query, for now returning mock data
  return [
    { name: 'Platinum', branches: 24, coverage: 83 },
    { name: 'Diamond', branches: 5, coverage: 23 },
    { name: 'Gold', branches: 30, coverage: 73 },
    { name: 'Silver', branches: 20, coverage: 99 },
    { name: 'Bronze', branches: 20, coverage: 85 }
  ];
}

export async function generateReportData(month?: string, year?: string) {
  // This would generate a report based on month/year
  // For now, returning mock data
  return {
    totalBranchVisits: 94,
    coveragePercentage: 65,
    avgParticipation: 81,
    topPerformer: 'Sanjay Singh',
    categoryBreakdown: [
      { name: 'Platinum', branches: 24, coverage: 83 },
      { name: 'Diamond', branches: 5, coverage: 23 },
      { name: 'Gold', branches: 30, coverage: 73 },
      { name: 'Silver', branches: 20, coverage: 99 },
      { name: 'Bronze', branches: 20, coverage: 85 }
    ]
  };
}
