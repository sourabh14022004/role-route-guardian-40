import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";

// Define types for Supabase responses
type QualitativeRating = 'very_poor' | 'poor' | 'neutral' | 'good' | 'excellent';
type BranchCategory = 'platinum' | 'diamond' | 'gold' | 'silver' | 'bronze';
type ReportStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
type UserRole = 'BH' | 'ZH' | 'CH' | 'admin';
type Gender = 'male' | 'female' | 'other';

interface Profile {
  id: string;
  full_name: string;
  e_code: string;
  role: UserRole;
  location: string;
  gender: Gender;
  created_at?: string;
  updated_at?: string;
}

interface Branch {
  id: string;
  name: string;
  location: string;
  category: BranchCategory;
  created_at?: string;
  updated_at?: string;
}

interface BranchAssignment {
  id: string;
  user_id: string;
  branch_id: string;
  assigned_at: string;
  profiles?: {
    full_name: string;
    e_code: string;
  };
  branches?: {
    name: string;
    location: string;
    category: BranchCategory;
  };
}

interface BranchVisit {
  id: string;
  user_id: string;
  branch_id: string;
  visit_date: string;
  branch_category: BranchCategory;
  hr_connect_session?: boolean;
  total_employees_invited?: number;
  total_participants?: number;
  manning_percentage?: number;
  attrition_percentage?: number;
  non_vendor_percentage?: number;
  er_percentage?: number;
  cwt_cases?: number;
  performance_level?: string;
  new_employees_total?: number;
  new_employees_covered?: number;
  star_employees_total?: number;
  star_employees_covered?: number;
  culture_branch?: QualitativeRating;
  line_manager_behavior?: QualitativeRating;
  branch_hygiene?: QualitativeRating;
  overall_discipline?: QualitativeRating;
  feedback?: string;
  status: ReportStatus;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    full_name: string;
    e_code: string;
  };
  branches?: {
    name: string;
    location: string;
    category: BranchCategory;
  };
}

interface BranchVisitReport extends BranchVisit {
  branch: {
    name: string;
    location: string;
    category: BranchCategory;
  };
  bhr: {
    name: string;
    code: string;
  };
}

interface Zone {
  id: string;
  name: string;
}

interface QualitativeMetricCounts {
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
  total: number;
}

interface HeatmapData extends QualitativeMetricCounts {
  metric: 'culture_branch' | 'line_manager_behavior' | 'branch_hygiene' | 'overall_discipline';
}

// Function to get qualitative data metrics by category
export const getQualitativeMetricsByCategory = async (
  dateRange?: { from: Date; to: Date } | null,
  branchCategory?: string | null
): Promise<Array<{
  metric: 'culture_branch' | 'line_manager_behavior' | 'branch_hygiene' | 'overall_discipline';
  counts: {
    very_poor: number;
    poor: number;
    neutral: number;
    good: number;
    excellent: number;
    total: number;
  };
}>> => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        culture_branch,
        line_manager_behavior,
        branch_hygiene,
        overall_discipline,
        branches:branch_id (
          category
        )
      `);
    
    // Apply date filter if provided
    if (dateRange?.from) {
      query = query.gte('visit_date', dateRange.from.toISOString().split('T')[0]);
      
      if (dateRange.to) {
        query = query.lte('visit_date', dateRange.to.toISOString().split('T')[0]);
      }
    }
    
    // Apply category filter if provided
    if (branchCategory && branchCategory !== 'all') {
      query = query.eq('branches.category', branchCategory.toLowerCase());
    }
    
    const { data, error } = await query as { data: Array<{
      culture_branch: QualitativeRating;
      line_manager_behavior: QualitativeRating;
      branch_hygiene: QualitativeRating;
      overall_discipline: QualitativeRating;
      branches: {
        category: string;
      } | null;
    }> | null, error: any };
    
    if (error) throw error;
    if (!data) return [];
    
    const metrics = ['culture_branch', 'line_manager_behavior', 'branch_hygiene', 'overall_discipline'] as const;
    
    return metrics.map(metric => {
      const counts = {
        very_poor: 0,
        poor: 0,
        neutral: 0,
        good: 0,
        excellent: 0,
        total: 0
      };
      
      data.forEach(visit => {
        const rating = visit[metric];
        if (rating && rating in counts) {
          counts[rating as keyof typeof counts]++;
          counts.total++;
        }
      });
      
      return {
        metric,
        counts
      };
    });
  } catch (error: any) {
    console.error("Error fetching qualitative metrics by category:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to get metrics data"
    });
    return [];
  }
};

// Get the breakdown of qualitative metrics for the heatmap
export const getQualitativeMetricsForHeatmap = async (
  metric: 'culture_branch' | 'line_manager_behavior' | 'branch_hygiene' | 'overall_discipline',
  dateRange?: { from: Date; to: Date | undefined } | null,
  branchCategory?: string | null
): Promise<HeatmapData[]> => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        culture_branch,
        line_manager_behavior,
        branch_hygiene,
        overall_discipline
      `);
    
    // Apply date filter if provided
    if (dateRange?.from) {
      query = query.gte('visit_date', dateRange.from.toISOString().split('T')[0]);
      
      if (dateRange.to) {
        query = query.lte('visit_date', dateRange.to.toISOString().split('T')[0]);
      }
    }
    
    // Apply category filter if provided
    if (branchCategory && branchCategory !== 'all') {
      query = query.eq('branch_category', branchCategory.toLowerCase());
    }
    
    const { data, error } = await query as { data: Array<{
      culture_branch: QualitativeRating;
      line_manager_behavior: QualitativeRating;
      branch_hygiene: QualitativeRating;
      overall_discipline: QualitativeRating;
    }> | null, error: any };
    
    if (error) throw error;
    if (!data) return [];
    
    const metrics = ['culture_branch', 'line_manager_behavior', 'branch_hygiene', 'overall_discipline'] as const;
    const ratings = ['very_poor', 'poor', 'neutral', 'good', 'excellent'] as const;
    
    return metrics.map(metric => {
      const counts: QualitativeMetricCounts = {
        very_poor: 0,
        poor: 0,
        neutral: 0,
        good: 0,
        excellent: 0,
        total: 0
      };
      
      data.forEach(visit => {
        const rating = visit[metric];
        if (rating && rating in counts) {
          counts[rating as keyof QualitativeMetricCounts]++;
          counts.total++;
        }
      });
      
      return {
        metric,
        ...counts
      };
    });
  } catch (error: any) {
    console.error("Error fetching qualitative metrics for heatmap:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to get metrics data"
    });
    return [];
  }
};

// Helper function to convert rating to numeric value
const getRatingValue = (rating: QualitativeRating): number => {
  switch (rating) {
    case 'excellent': return 5;
    case 'good': return 4;
    case 'neutral': return 3;
    case 'poor': return 2;
    case 'very_poor': return 1;
    default: return 0;
  }
};

// Fetch monthly summary report data
export const fetchMonthlySummaryReport = async (month: string, year: string) => {
  try {
    // First get all BHRs
    const { data: bhrs, error: bhrsError } = await supabase
      .from('profiles')
      .select('id, full_name, e_code')
      .eq('role', 'BH') as { data: Array<{
        id: string;
        full_name: string;
        e_code: string;
      }>, error: any };
      
    if (bhrsError) throw bhrsError;
    if (!bhrs) return [];
    
    const monthlyReport = [];
    
    // For each BHR, get their visit metrics
    for (const bhr of bhrs) {
      // Get visit data for the BHR
      let visitsQuery = supabase
        .from('branch_visits')
        .select('*')
        .eq('user_id', bhr.id);
      
      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        visitsQuery = visitsQuery
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
      }
      
      const { data: visitsData, error: visitsError } = await visitsQuery as { data: BranchVisit[] | null, error: any };
      
      if (visitsError) throw visitsError;
      
      const totalVisits = visitsData?.length || 0;
      
      // Calculate unique branches visited
      const uniqueBranches = new Set(visitsData?.map(v => v.branch_id) || []).size;
      
      // Calculate average manning and attrition
      let totalManning = 0;
      let totalAttrition = 0;
      let validManningCount = 0;
      let validAttritionCount = 0;
      
      visitsData?.forEach(visit => {
        if (visit.manning_percentage !== undefined) {
          totalManning += visit.manning_percentage;
          validManningCount++;
        }
        if (visit.attrition_percentage !== undefined) {
          totalAttrition += visit.attrition_percentage;
          validAttritionCount++;
        }
      });
      
      const avgManning = validManningCount > 0 ? Math.round(totalManning / validManningCount) : 0;
      const avgAttrition = validAttritionCount > 0 ? Math.round(totalAttrition / validAttritionCount) : 0;
      
      // Calculate metrics distribution
      const qualitativeMetrics = {
        culture_branch: { good: 0, neutral: 0, poor: 0 },
        line_manager_behavior: { good: 0, neutral: 0, poor: 0 },
        branch_hygiene: { good: 0, neutral: 0, poor: 0 },
        overall_discipline: { good: 0, neutral: 0, poor: 0 }
      };
      
      visitsData?.forEach(visit => {
        Object.keys(qualitativeMetrics).forEach(metric => {
          const rating = visit[metric as keyof typeof visit] as QualitativeRating;
          if (rating) {
            if (rating === 'excellent' || rating === 'good') {
              qualitativeMetrics[metric as keyof typeof qualitativeMetrics].good++;
            } else if (rating === 'neutral') {
              qualitativeMetrics[metric as keyof typeof qualitativeMetrics].neutral++;
            } else {
              qualitativeMetrics[metric as keyof typeof qualitativeMetrics].poor++;
            }
          }
        });
      });
      
      monthlyReport.push({
        BHR_Name: bhr.full_name,
        e_code: bhr.e_code,
        Total_Visits: totalVisits,
        Unique_Branches: uniqueBranches,
        Avg_Manning: `${avgManning}%`,
        Avg_Attrition: `${avgAttrition}%`,
        Culture_Good: qualitativeMetrics.culture_branch.good,
        Culture_Neutral: qualitativeMetrics.culture_branch.neutral,
        Culture_Poor: qualitativeMetrics.culture_branch.poor,
        LM_Good: qualitativeMetrics.line_manager_behavior.good,
        LM_Neutral: qualitativeMetrics.line_manager_behavior.neutral,
        LM_Poor: qualitativeMetrics.line_manager_behavior.poor,
        Hygiene_Good: qualitativeMetrics.branch_hygiene.good,
        Hygiene_Neutral: qualitativeMetrics.branch_hygiene.neutral,
        Hygiene_Poor: qualitativeMetrics.branch_hygiene.poor,
        Discipline_Good: qualitativeMetrics.overall_discipline.good,
        Discipline_Neutral: qualitativeMetrics.overall_discipline.neutral,
        Discipline_Poor: qualitativeMetrics.overall_discipline.poor
      });
    }
    
    return monthlyReport;
  } catch (error: any) {
    console.error("Error fetching monthly summary report:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to fetch monthly summary report"
    });
    return [];
  }
};

// Fetch category breakdown data
export const fetchCategoryBreakdown = async (month?: string, year?: string) => {
  try {
    let fromDate, toDate;
    
    // If month and year provided, filter by date
    if (month && year) {
      const monthIndex = ["January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December"].indexOf(month);
        
      if (monthIndex !== -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0);
        
        fromDate = startDate.toISOString().split('T')[0];
        toDate = endDate.toISOString().split('T')[0];
      }
    }
    
    // Get all branches by category
    const { data: branchesData, error: branchesError } = await supabase
      .from('branches')
      .select('category, id');
      
    if (branchesError) throw branchesError;
    
    // Count branches by category
    const categoryBranches = {
      platinum: 0,
      diamond: 0,
      gold: 0,
      silver: 0,
      bronze: 0
    };
    
    branchesData?.forEach(branch => {
      if (branch.category && categoryBranches.hasOwnProperty(branch.category)) {
        categoryBranches[branch.category as keyof typeof categoryBranches]++;
      }
    });
    
    // Get visits by branch category
    let visitsQuery = supabase
      .from('branch_visits')
      .select('branch_id, branch_category, count');
      
    // Apply date filter if available
    if (fromDate && toDate) {
      visitsQuery = visitsQuery
        .gte('visit_date', fromDate)
        .lte('visit_date', toDate);
    }
    
    const { data: visitsData, error: visitsError } = await visitsQuery;
    
    if (visitsError) throw visitsError;
    
    // Count unique branches visited per category
    const visitedBranches = {
      platinum: new Set<string>(),
      diamond: new Set<string>(),
      gold: new Set<string>(),
      silver: new Set<string>(),
      bronze: new Set<string>()
    };
    
    visitsData?.forEach(visit => {
      if (visit.branch_category && visit.branch_id && 
          visitedBranches.hasOwnProperty(visit.branch_category)) {
        visitedBranches[visit.branch_category as keyof typeof visitedBranches].add(visit.branch_id);
      }
    });
    
    // Calculate coverage percentages
    const categoryData = [
      {
        name: 'Platinum',
        branches: categoryBranches.platinum,
        coverage: categoryBranches.platinum > 0 ? 
          Math.round((visitedBranches.platinum.size / categoryBranches.platinum) * 100) : 0,
        averageVisits: visitedBranches.platinum.size ? 
          Math.round((visitsData?.filter(v => v.branch_category === 'platinum').length || 0) / visitedBranches.platinum.size) : 0
      },
      {
        name: 'Diamond',
        branches: categoryBranches.diamond,
        coverage: categoryBranches.diamond > 0 ? 
          Math.round((visitedBranches.diamond.size / categoryBranches.diamond) * 100) : 0,
        averageVisits: visitedBranches.diamond.size ? 
          Math.round((visitsData?.filter(v => v.branch_category === 'diamond').length || 0) / visitedBranches.diamond.size) : 0
      },
      {
        name: 'Gold',
        branches: categoryBranches.gold,
        coverage: categoryBranches.gold > 0 ? 
          Math.round((visitedBranches.gold.size / categoryBranches.gold) * 100) : 0,
        averageVisits: visitedBranches.gold.size ? 
          Math.round((visitsData?.filter(v => v.branch_category === 'gold').length || 0) / visitedBranches.gold.size) : 0
      },
      {
        name: 'Silver',
        branches: categoryBranches.silver,
        coverage: categoryBranches.silver > 0 ? 
          Math.round((visitedBranches.silver.size / categoryBranches.silver) * 100) : 0,
        averageVisits: visitedBranches.silver.size ? 
          Math.round((visitsData?.filter(v => v.branch_category === 'silver').length || 0) / visitedBranches.silver.size) : 0
      },
      {
        name: 'Bronze',
        branches: categoryBranches.bronze,
        coverage: categoryBranches.bronze > 0 ? 
          Math.round((visitedBranches.bronze.size / categoryBranches.bronze) * 100) : 0,
        averageVisits: visitedBranches.bronze.size ? 
          Math.round((visitsData?.filter(v => v.branch_category === 'bronze').length || 0) / visitedBranches.bronze.size) : 0
      }
    ];
    
    return categoryData;
  } catch (error: any) {
    console.error("Error fetching category breakdown:", error);
    toast({
      variant: "destructive", 
      title: "Error fetching category breakdown",
      description: error.message || "Unable to load category data"
    });
    
    return [
      { name: 'Platinum', branches: 0, coverage: 0, averageVisits: 0 },
      { name: 'Diamond', branches: 0, coverage: 0, averageVisits: 0 },
      { name: 'Gold', branches: 0, coverage: 0, averageVisits: 0 },
      { name: 'Silver', branches: 0, coverage: 0, averageVisits: 0 },
      { name: 'Bronze', branches: 0, coverage: 0, averageVisits: 0 }
    ];
  }
};

// Export branch visit data as Excel (returning data that would be exported)
export const exportBranchVisitData = async (
  month?: string, 
  year?: string,
  location?: string,
  category?: string,
  bhr?: string
) => {
  try {
    let query = supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        branch_id,
        branch_name,
        branch_location,
        branch_category,
        user_id,
        profiles:user_id (full_name, e_code),
        manning_percentage,
        attrition_percentage,
        er_percentage,
        cwt_cases,
        hr_connect_session,
        total_participants,
        total_employees_invited,
        created_at,
        status
      `);
    
    // Apply filters if provided
    if (month && year) {
      const monthIndex = ["January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December"].indexOf(month);
        
      if (monthIndex !== -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0);
        
        const fromDate = startDate.toISOString().split('T')[0];
        const toDate = endDate.toISOString().split('T')[0];
        
        query = query
          .gte('visit_date', fromDate)
          .lte('visit_date', toDate);
      }
    }
    
    if (location && location !== 'all') {
      query = query.eq('branch_location', location);
    }
    
    if (category && category !== 'all') {
      query = query.eq('branch_category', category.toLowerCase());
    }
    
    if (bhr && bhr !== 'all') {
      query = query.eq('user_id', bhr);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Transform data for export
    const exportData = data?.map(visit => ({
      Visit_ID: visit.id,
      Visit_Date: visit.visit_date,
      Branch_Name: visit.branch_name,
      Branch_Location: visit.branch_location,
      Branch_Category: visit.branch_category,
      BHR_Name: visit.profiles?.[0]?.full_name || 'N/A',
      BHR_Code: visit.profiles?.[0]?.e_code || 'N/A',
      Manning_Percentage: visit.manning_percentage || 0,
      Attrition_Percentage: visit.attrition_percentage || 0,
      ER_Percentage: visit.er_percentage || 0,
      CWT_Cases: visit.cwt_cases || 0,
      HR_Connect_Session: visit.hr_connect_session ? 'Yes' : 'No',
      Participants: visit.total_participants || 0,
      Invited_Employees: visit.total_employees_invited || 0,
      Participation_Rate: visit.total_employees_invited ? 
        Math.round((visit.total_participants || 0) / visit.total_employees_invited * 100) : 0,
      Created_At: new Date(visit.created_at).toLocaleString(),
      Status: visit.status?.charAt(0).toUpperCase() + visit.status?.slice(1) || 'Draft'
    }));
    
    return exportData || [];
  } catch (error: any) {
    console.error("Error exporting branch visit data:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Failed to export branch visit data"
    });
    return [];
  }
};

// Export BHR performance summary
export const exportBHRPerformanceSummary = async (
  month?: string,
  year?: string
) => {
  try {
    // Get all BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id, full_name, e_code, designation')
      .eq('role', 'BH') as { data: Array<{
        id: string;
        full_name: string;
        e_code: string;
        designation?: string;
      }>, error: any };
    
    if (bhrError) throw bhrError;
    if (!bhrs) return [];
    
    const bhrPerformance = [];
    
    // For each BHR, get their visit metrics
    for (const bhr of bhrs) {
      // Get assigned branches count
      const { count: assignedCount, error: assignedError } = await supabase
        .from('branch_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', bhr.id);
      
      if (assignedError) throw assignedError;
      
      const assignedBranches = assignedCount || 0;
      
      // Get visit data for the BHR
      let visitsQuery = supabase
        .from('branch_visits')
        .select('*')
        .eq('user_id', bhr.id);
      
      if (month && year) {
        const startDate = `${year}-${month.padStart(2, '0')}-01`;
        const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];
        visitsQuery = visitsQuery
          .gte('visit_date', startDate)
          .lte('visit_date', endDate);
      }
      
      const { data: visitsData, error: visitsError } = await visitsQuery as { data: BranchVisit[] | null, error: any };
      
      if (visitsError) throw visitsError;
      
      const totalVisits = visitsData?.length || 0;
      const approvedVisits = visitsData?.filter(v => v.status === 'approved').length || 0;
      const submittedVisits = visitsData?.filter(v => v.status === 'submitted').length || 0;
      const rejectedVisits = visitsData?.filter(v => v.status === 'rejected').length || 0;
      
      // Calculate unique branches visited
      const uniqueBranchesVisited = new Set(visitsData?.map(v => v.branch_id)).size;
      
      // Calculate completion rate
      const completionRate = assignedBranches > 0 ? 
        Math.round((uniqueBranchesVisited / assignedBranches) * 100) : 0;
        
      // Calculate average manning and attrition
      let totalManning = 0;
      let totalAttrition = 0;
      let validManningCount = 0;
      let validAttritionCount = 0;
      
      visitsData?.forEach(visit => {
        if (visit.manning_percentage !== undefined) {
          totalManning += visit.manning_percentage;
          validManningCount++;
        }
        if (visit.attrition_percentage !== undefined) {
          totalAttrition += visit.attrition_percentage;
          validAttritionCount++;
        }
      });
      
      const avgManning = validManningCount > 0 ? Math.round(totalManning / validManningCount) : 0;
      const avgAttrition = validAttritionCount > 0 ? Math.round(totalAttrition / validAttritionCount) : 0;
      
      bhrPerformance.push({
        BHR_Name: bhr.full_name,
        e_code: bhr.e_code,
        Designation: bhr.designation || 'Branch HR',
        Assigned_Branches: assignedBranches,
        Total_Visits: totalVisits,
        Unique_Branches_Visited: uniqueBranchesVisited,
        Completion_Rate: `${completionRate}%`,
        Approved_Reports: approvedVisits,
        submitted_Reports: submittedVisits,
        Rejected_Reports: rejectedVisits,
        Avg_Manning: `${avgManning}%`,
        Avg_Attrition: `${avgAttrition}%`,
      });
    }
    
    return bhrPerformance;
  } catch (error: any) {
    console.error("Error exporting BHR performance summary:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Failed to export BHR performance data"
    });
    return [];
  }
};

// Export branch assignments data
export const exportBranchAssignments = async () => {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .select(`
        id,
        user_id,
        branch_id,
        profiles:user_id (full_name, e_code),
        branches:branch_id (name, location, category)
      `) as { data: BranchAssignment[] | null, error: any };
      
    if (error) throw error;
    
    // Transform data for export
    const exportData = data?.map(assignment => ({
      BHR_Name: assignment.profiles?.full_name || 'N/A',
      BHR_Code: assignment.profiles?.e_code || 'N/A',
      Branch_Name: assignment.branches?.name || 'N/A',
      Branch_Location: assignment.branches?.location || 'N/A',
      Branch_Category: assignment.branches?.category || 'bronze'
    })) || [];
    
    return exportData;
  } catch (error: any) {
    console.error("Error exporting branch assignments:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Failed to export branch assignments data"
    });
    return [];
  }
};



// Update report status
export const updateReportStatus = async (
  reportId: string,
  status: 'approved' | 'rejected',
  feedback?: string
) => {
  try {
    const { error } = await supabase
      .from('branch_visits')
      .update({
        status,
        feedback,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', reportId);
    
    if (error) throw error;
    
    toast({
      title: "Success",
      description: `Report ${status === 'approved' ? 'approved' : 'rejected'} successfully`
    });
    
    return true;
  } catch (error: any) {
    console.error("Error updating report status:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to update report status"
    });
    return false;
  }
};

// Get stats for a BHR's reports
export const fetchBHRReportStats = async (bhId: string) => {
  try {
    const { data: totalData, error: totalError } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('user_id', bhId) as { data: BranchVisit[] | null, error: any };
    
    if (totalError) throw totalError;
    
    const { data: approvedData, error: approvedError } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('user_id', bhId)
      .eq('status', 'approved') as { data: BranchVisit[] | null, error: any };
    
    if (approvedError) throw approvedError;
    
    const { data: submittedData, error: submittedError } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('user_id', bhId)
      .eq('status', 'submitted') as { data: BranchVisit[] | null, error: any };
    
    if (submittedError) throw submittedError;
    
    const { data: rejectedData, error: rejectedError } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('user_id', bhId)
      .eq('status', 'rejected') as { data: BranchVisit[] | null, error: any };
    
    if (rejectedError) throw rejectedError;
    
    return {
      total: totalData?.length || 0,
      approved: approvedData?.length || 0,
      submitted: submittedData?.length || 0,
      rejected: rejectedData?.length || 0
    };
  } catch (error) {
    console.error("Error in fetchBHRReportStats:", error);
    return {
      total: 0,
      approved: 0,
      submitted: 0, 
      rejected: 0
    };
  }
};

// Get active BHRs count
export const getActiveBHRsCount = async () => {
  try {
    // Get all BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH') as { data: Array<{ id: string }>, error: any };
    
    if (bhrError) throw bhrError;
    if (!bhrs) return { count: 0, total: 0 };
    
    const total = bhrs.length;
    
    // Get current month's start and end dates
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Get active BHRs (those who submitted at least one report this month)
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('user_id')
      .gte('visit_date', startOfMonth.toISOString().split('T')[0])
      .lte('visit_date', endOfMonth.toISOString().split('T')[0])
      .in('status', ['submitted', 'approved']) as { data: Array<{ user_id: string }>, error: any };
    
    if (visitsError) throw visitsError;
    if (!visits) return { count: 0, total };
    
    // Count unique BHRs who submitted reports
    const uniqueActiveBHRs = new Set(visits.map(visit => visit.user_id));
    
    return {
      count: uniqueActiveBHRs.size,
      total
    };
  } catch (error: any) {
    console.error("Error getting active BHRs count:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to get active BHRs count"
    });
    return { count: 0, total: 0 };
  }
};

// Get total branch visits in current month
export const getTotalBranchVisitsInMonth = async () => {
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const { count, error } = await supabase
      .from('branch_visits')
      .select('*', { count: 'exact', head: true })
      .gte('visit_date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
      .lt('visit_date', `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`);
    
    if (error) throw error;
    
    return { count: count || 0 };
  } catch (error: any) {
    console.error("Error getting total branch visits:", error);
    return { count: 0 };
  }
};

export interface BranchVisitResponse {
  id: string;
  visit_date: string;
  status: string;
  manning_percentage?: number;
  attrition_percentage?: number;
  er_percentage?: number;
  total_employees_invited?: number;
  total_participants?: number;
  hr_connect_session?: boolean;
  culture_branch?: QualitativeRating;
  line_manager_behavior?: QualitativeRating;
  branch_hygiene?: QualitativeRating;
  overall_discipline?: QualitativeRating;
  feedback?: string;
  non_vendor_percentage?: number;
  cwt_cases?: number;
  performance_level?: string;
  new_employees_total?: number;
  new_employees_covered?: number;
  star_employees_total?: number;
  star_employees_covered?: number;
  branches: {
    name: string;
    location: string;
    category: string;
  };
  profiles: {
    full_name: string;
    e_code: string;
  };
}

export interface BranchVisitSummary {
  id: string;
  visit_date: string;
  status: string;
  manning_percentage?: number;
  attrition_percentage?: number;
  er_percentage?: number;
  total_employees_invited?: number;
  total_participants?: number;
  hr_connect_session?: boolean;
  feedback?: string;
  non_vendor_percentage?: number;
  cwt_cases?: number;
  performance_level?: string;
  new_employees_total?: number;
  new_employees_covered?: number;
  star_employees_total?: number;
  star_employees_covered?: number;
  leaders_aligned_with_code?: string;
  employees_feel_safe?: string;
  employees_feel_motivated?: string;
  leaders_abusive_language?: string;
  employees_comfort_escalation?: string;
  inclusive_culture?: string;
  branches?: {
    id: string;
    name: string;
    location: string;
    category: BranchCategory;
    branch_code: string | null;
  };
  profiles?: {
    full_name: string;
    e_code: string;
  };
}

// Fetch recent reports for ZH dashboard
export const fetchRecentReports = async (limit: number = 10): Promise<BranchVisitSummary[]> => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        visit_date,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        total_employees_invited,
        total_participants,
        hr_connect_session,
        culture_branch,
        line_manager_behavior,
        branch_hygiene,
        overall_discipline,
        feedback,
        non_vendor_percentage,
        cwt_cases,
        performance_level,
        new_employees_total,
        new_employees_covered,
        star_employees_total,
        star_employees_covered,
        branches:branch_id (name, location, category),
        profiles:user_id (full_name, e_code)
      `)
      .order('visit_date', { ascending: false })
      .limit(limit) as { data: BranchVisitResponse[] | null, error: any };
    
    if (error) throw error;
    if (!data) return [];
    
    return data.map(visit => ({
      id: visit.id,
      branch_name: visit.branches.name,
      branch_location: visit.branches.location,
      branch_category: visit.branches.category,
      bh_name: visit.profiles.full_name,
      bh_code: visit.profiles.e_code,
      visit_date: visit.visit_date,
      status: visit.status,
      manning_percentage: visit.manning_percentage,
      attrition_percentage: visit.attrition_percentage,
      er_percentage: visit.er_percentage,
      total_employees_invited: visit.total_employees_invited,
      total_participants: visit.total_participants,
      hr_connect_session: visit.hr_connect_session,
      culture_branch: visit.culture_branch,
      line_manager_behavior: visit.line_manager_behavior,
      branch_hygiene: visit.branch_hygiene,
      overall_discipline: visit.overall_discipline,
      feedback: visit.feedback,
      non_vendor_percentage: visit.non_vendor_percentage,
      cwt_cases: visit.cwt_cases,
      performance_level: visit.performance_level,
      new_employees_total: visit.new_employees_total,
      new_employees_covered: visit.new_employees_covered,
      star_employees_total: visit.star_employees_total,
      star_employees_covered: visit.star_employees_covered
    }));
  } catch (error: any) {
    console.error("Error fetching recent reports:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to fetch recent reports"
    });
    return [];
  }
};

// Fetch report by ID
export const fetchReportById = async (id: string): Promise<BranchVisitSummary | null> => {
  try {
    const { data: visit, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        visit_date,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        total_employees_invited,
        total_participants,
        hr_connect_session,
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture,
        feedback,
        non_vendor_percentage,
        cwt_cases,
        performance_level,
        new_employees_total,
        new_employees_covered,
        star_employees_total,
        star_employees_covered,
        branches:branch_id (id, name, location, category, branch_code),
        profiles (full_name, e_code)
      `)
      .eq('id', id)
      .single() as {
        data: {
          id: string;
          branch_id: string;
          visit_date: string;
          status: string;
          manning_percentage?: number;
          attrition_percentage?: number;
          er_percentage?: number;
          total_employees_invited?: number;
          total_participants?: number;
          hr_connect_session?: boolean;
          leaders_aligned_with_code?: string;
          employees_feel_safe?: string;
          employees_feel_motivated?: string;
          leaders_abusive_language?: string;
          employees_comfort_escalation?: string;
          inclusive_culture?: string;
          feedback?: string;
          non_vendor_percentage?: number;
          cwt_cases?: number;
          performance_level?: string;
          new_employees_total?: number;
          new_employees_covered?: number;
          star_employees_total?: number;
          star_employees_covered?: number;
          branches: {
            id: string;
            name: string;
            location: string;
            category: BranchCategory;
            branch_code: string | null;
          };
          profiles: {
            full_name: string;
            e_code: string;
          };
        } | null;
        error: any;
      };
    
    if (error) throw error;
    if (!visit) return null;
    
    return {
      id: visit.id,
      visit_date: visit.visit_date,
      status: visit.status,
      manning_percentage: visit.manning_percentage,
      attrition_percentage: visit.attrition_percentage,
      er_percentage: visit.er_percentage,
      total_employees_invited: visit.total_employees_invited,
      total_participants: visit.total_participants,
      hr_connect_session: visit.hr_connect_session,
      feedback: visit.feedback,
      non_vendor_percentage: visit.non_vendor_percentage,
      cwt_cases: visit.cwt_cases,
      performance_level: visit.performance_level,
      new_employees_total: visit.new_employees_total,
      new_employees_covered: visit.new_employees_covered,
      star_employees_total: visit.star_employees_total,
      star_employees_covered: visit.star_employees_covered,
      leaders_aligned_with_code: visit.leaders_aligned_with_code,
      employees_feel_safe: visit.employees_feel_safe,
      employees_feel_motivated: visit.employees_feel_motivated,
      leaders_abusive_language: visit.leaders_abusive_language,
      employees_comfort_escalation: visit.employees_comfort_escalation,
      inclusive_culture: visit.inclusive_culture,
      branches: visit.branches,
      profiles: visit.profiles
    };
  } catch (error: any) {
    console.error("Error fetching report:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: error.message || "Failed to fetch report details"
    });
    return null;
  }
};
