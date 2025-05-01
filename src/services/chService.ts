
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

export async function fetchDashboardStats() {
  try {
    // Get total branches
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('*', { count: 'exact', head: true });

    if (branchError) throw branchError;

    // Get visited branches (unique branches with at least one visit)
    const { data: visitedBranchData, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .eq('status', 'approved');

    if (visitError) throw visitError;

    // Count unique visited branches
    const visitedBranchIds = new Set((visitedBranchData || []).map(v => v.branch_id));
    const visitedBranchesCount = visitedBranchIds.size;

    // Get active BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH');

    if (bhrError) throw bhrError;

    // Get recent visits for metrics
    const lastMonthDate = new Date();
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
    
    const { data: recentVisits, error: recentError } = await supabase
      .from('branch_visits')
      .select('*')
      .gte('visit_date', lastMonthDate.toISOString())
      .eq('status', 'approved');

    if (recentError) throw recentError;

    // Calculate averages
    const manningSum = recentVisits?.reduce((sum, visit) => sum + (visit.manning_percentage || 0), 0) || 0;
    const attritionSum = recentVisits?.reduce((sum, visit) => sum + (visit.attrition_percentage || 0), 0) || 0;
    const erSum = recentVisits?.reduce((sum, visit) => sum + (visit.er_percentage || 0), 0) || 0;
    
    const visitCount = recentVisits?.length || 1; // Avoid division by zero

    return {
      totalBranches: totalBranches || 0,
      visitedBranches: visitedBranchesCount,
      coverage: totalBranches ? Math.round((visitedBranchesCount / totalBranches) * 100) : 0,
      activeBHRs: bhrs?.length || 0,
      avgCoverage: 78, // This would require more complex calculation, using placeholder
      attritionRate: Math.round(attritionSum / visitCount),
      manningPercentage: Math.round(manningSum / visitCount),
      erPercentage: Math.round(erSum / visitCount),
      vsLastMonth: {
        coverage: 5,
        avgCoverage: 5,
        attritionRate: -3,
        manningPercentage: 2,
        erPercentage: 0
      }
    };
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading dashboard statistics",
      description: error.message || "An unexpected error occurred"
    });
    throw error;
  }
}

export async function fetchBranchCategoryStats() {
  try {
    // Get all branches with their categories
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, category');
    
    if (branchError) throw branchError;

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

    branches?.forEach(branch => {
      const category = branch.category as string;
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
    throw error;
  }
}

export async function fetchMonthlyTrends(): Promise<MonthlyStats[]> {
  try {
    const months = ["May", "June", "July", "August", "September"];
    
    // This would normally come from a database query aggregating by month
    // For now, returning mock data
    return [
      { month: "May", branchCoverage: 65, participationRate: 70 },
      { month: "June", branchCoverage: 68, participationRate: 72 },
      { month: "July", branchCoverage: 70, participationRate: 68 },
      { month: "August", branchCoverage: 75, participationRate: 73 },
      { month: "September", branchCoverage: 78, participationRate: 75 }
    ];
  } catch (error: any) {
    console.error("Error fetching monthly trends:", error);
    toast({
      variant: "destructive",
      title: "Error loading monthly trends",
      description: error.message || "An unexpected error occurred"
    });
    throw error;
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

    // Get branch assignments
    const { data: assignments, error: assignmentError } = await supabase
      .from('branch_assignments')
      .select('user_id, branch_id');
    
    if (assignmentError) throw assignmentError;

    // Get branch visits
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select('user_id, branch_id')
      .eq('status', 'approved');
    
    if (visitError) throw visitError;

    // Group assignments by BHR
    const bhrAssignments: Record<string, Set<string>> = {};
    assignments?.forEach(assignment => {
      if (!bhrAssignments[assignment.user_id]) {
        bhrAssignments[assignment.user_id] = new Set();
      }
      bhrAssignments[assignment.user_id].add(assignment.branch_id);
    });

    // Count visits by BHR
    const bhrVisits: Record<string, Set<string>> = {};
    visits?.forEach(visit => {
      if (!bhrVisits[visit.user_id]) {
        bhrVisits[visit.user_id] = new Set();
      }
      bhrVisits[visit.user_id].add(visit.branch_id);
    });

    // Calculate coverage and reports for each BHR
    const performers = (bhrs || []).map(bhr => {
      const assignedBranches = bhrAssignments[bhr.id] || new Set();
      const visitedBranches = bhrVisits[bhr.id] || new Set();
      
      return {
        id: bhr.id,
        name: bhr.full_name,
        e_code: bhr.e_code,
        reports: visitedBranches.size,
        coverage: assignedBranches.size > 0 
          ? Math.round((visitedBranches.size / assignedBranches.size) * 100) 
          : 0
      };
    });

    // Sort by coverage and then by number of reports
    return performers.sort((a, b) => {
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return b.reports - a.reports;
    }).slice(0, 3); // Return top 3
  } catch (error: any) {
    console.error("Error fetching top performers:", error);
    toast({
      variant: "destructive",
      title: "Error loading top performers",
      description: error.message || "An unexpected error occurred"
    });
    throw error;
  }
}

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
