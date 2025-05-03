
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface BranchVisitSummary {
  id: string;
  visit_date: string;
  status: string | null;
  branch_name: string;
  branch_location: string;
  branch_category: string;
  bh_name: string;
  bh_code: string;
}

export interface BHRReportStats {
  total: number;
  approved: number;
  submitted: number;
  rejected: number;
}

// Define interfaces for the report data
export interface MonthlySummaryReport {
  totalBranchVisits: number;
  coveragePercentage: number;
  avgParticipation: number;
  topPerformer: string;
}

export interface CategoryBreakdown {
  name: string;
  branches: number;
  coverage: number;
  averageVisits: number;
}

export async function fetchRecentReports(limit: number = 5): Promise<BranchVisitSummary[]> {
  try {
    // First get the visits
    const { data: rawVisits, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        visit_date,
        status,
        branches:branch_id (
          name,
          location,
          category
        ),
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!rawVisits?.length) return [];

    return rawVisits.map(visit => ({
      id: visit.id,
      visit_date: visit.visit_date,
      status: visit.status,
      branch_name: visit.branches?.name || 'Unknown',
      branch_location: visit.branches?.location || 'Unknown',
      branch_category: visit.branches?.category || 'Unknown',
      bh_name: visit.profiles?.full_name || 'Unknown',
      bh_code: visit.profiles?.e_code || 'Unknown'
    }));
  } catch (error: any) {
    console.error("Error fetching recent reports:", error);
    toast({
      variant: "destructive",
      title: "Error loading reports",
      description: error.message || "Unable to load recent reports"
    });
    return [];
  }
}

export async function fetchReportById(reportId: string) {
  try {
    // Get the visit first
    const { data: visit, error } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !visit) {
      throw error || new Error("Visit not found");
    }

    // Get branch details
    const { data: branch } = await supabase
      .from('branches')
      .select('*')
      .eq('id', visit.branch_id)
      .single();

    // Get BHR details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, e_code')
      .eq('id', visit.user_id)
      .single();

    return {
      ...visit,
      branch_name: branch?.name || 'Unknown',
      branch_location: branch?.location || 'Unknown',
      branch_category: branch?.category || 'Unknown',
      bh_name: profile?.full_name || 'Unknown',
      bh_code: profile?.e_code || 'Unknown'
    };
  } catch (error: any) {
    console.error("Error fetching report details:", error);
    toast({
      variant: "destructive",
      title: "Error loading report",
      description: error.message || "Unable to load report details"
    });
    return null;
  }
}

export async function updateReportStatus(reportId: string, status: "approved" | "rejected") {
  try {
    const { error } = await supabase
      .from('branch_visits')
      .update({ status })
      .eq('id', reportId);

    if (error) throw error;

    toast({
      title: `Report ${status}`,
      description: `The report has been ${status} successfully.`
    });
    
    return true;
  } catch (error: any) {
    console.error("Error updating report status:", error);
    toast({
      variant: "destructive",
      title: "Error updating report",
      description: error.message || "Unable to update report status"
    });
    return false;
  }
}

// Define the type for qualitative metrics based on the actual database schema
export type QualitativeMetric = 
  'leaders_aligned_with_code' | 
  'employees_feel_safe' | 
  'employees_feel_motivated' | 
  'leaders_abusive_language' |
  'employees_comfort_escalation' |
  'inclusive_culture';

// Define the type for heatmap data
export interface HeatmapData {
  metric: QualitativeMetric;
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
  total: number;
}

/**
 * Fetches statistics for a BHR's reports
 * @param bhrId The ID of the BHR whose stats to fetch
 * @returns Object with stats about report counts by status
 */
export async function fetchBHRReportStats(bhrId: string): Promise<BHRReportStats> {
  try {
    // Get all reports for this BHR
    const { data, error } = await supabase
      .from('branch_visits')
      .select('status')
      .eq('user_id', bhrId);
    
    if (error) throw error;
    
    // Initialize stats object
    const stats: BHRReportStats = {
      total: 0,
      approved: 0,
      submitted: 0, 
      rejected: 0
    };
    
    // Count reports by status
    if (data) {
      stats.total = data.length;
      
      data.forEach(visit => {
        if (visit.status === 'approved') stats.approved += 1;
        else if (visit.status === 'submitted') stats.submitted += 1;
        else if (visit.status === 'rejected') stats.rejected += 1;
      });
    }
    
    return stats;
  } catch (error: any) {
    console.error("Error fetching BHR report stats:", error);
    toast({
      variant: "destructive",
      title: "Error loading stats",
      description: error.message || "Unable to load BHR statistics"
    });
    return {
      total: 0,
      approved: 0,
      submitted: 0,
      rejected: 0
    };
  }
}

export async function getQualitativeMetricsForHeatmap(
  dateRange?: { from: Date; to: Date },
  branchCategory?: string | null
): Promise<HeatmapData[]> {
  try {
    let query = supabase
      .from('branch_visits')
      .select(`
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture
      `);
    
    // Apply date range filter if provided
    if (dateRange?.from) {
      query = query.gte('visit_date', dateRange.from.toISOString().split('T')[0]);
      
      if (dateRange.to) {
        query = query.lte('visit_date', dateRange.to.toISOString().split('T')[0]);
      }
    }
    
    // Apply branch category filter if provided
    if (branchCategory) {
      query = query.eq('branch_category', branchCategory);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Initialize metrics object
    const metrics: QualitativeMetric[] = [
      'leaders_aligned_with_code',
      'employees_feel_safe',
      'employees_feel_motivated',
      'leaders_abusive_language',
      'employees_comfort_escalation',
      'inclusive_culture'
    ];
    
    const ratings = ['very_poor', 'poor', 'neutral', 'good', 'excellent'];
    
    // Process the data into the required format
    const result: HeatmapData[] = metrics.map(metric => {
      // Count occurrences of each rating for this metric
      const counts = {
        very_poor: 0,
        poor: 0,
        neutral: 0,
        good: 0,
        excellent: 0,
        total: 0
      };
      
      if (data) {
        data.forEach(item => {
          const value = item[metric as keyof typeof item] as string;
          if (value && ratings.includes(value)) {
            counts[value as keyof typeof counts] += 1;
            counts.total += 1;
          }
        });
      }
      
      return {
        metric,
        ...counts
      };
    });
    
    return result;
  } catch (error: any) {
    console.error("Error fetching qualitative metrics:", error);
    toast({
      variant: "destructive",
      title: "Error loading metrics",
      description: error.message || "Unable to load qualitative metrics"
    });
    return [];
  }
}

/**
 * Fetches monthly summary report data
 * @param month The month to get data for
 * @param year The year to get data for
 */
export async function fetchMonthlySummaryReport(
  month: string, 
  year: string
): Promise<MonthlySummaryReport> {
  try {
    // Get the numeric month value (0-11)
    const months = ["January", "February", "March", "April", "May", "June", "July", 
      "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) throw new Error("Invalid month name");
    
    // Create date range for the query
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0); // Last day of month
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get branch visits in the month
    const { data: visits, error } = await supabase
      .from('branch_visits')
      .select(`
        *,
        profiles:user_id (
          full_name
        )
      `)
      .gte('visit_date', startDateStr)
      .lte('visit_date', endDateStr);
      
    if (error) throw error;
    
    // Calculate metrics
    const totalBranchVisits = visits?.length || 0;
    
    // Get all branches to calculate coverage
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id');
      
    if (branchError) throw branchError;
    
    // Calculate coverage percentage
    const uniqueBranchesVisited = new Set(visits?.map(v => v.branch_id) || []);
    const coveragePercentage = branches?.length 
      ? Math.round((uniqueBranchesVisited.size / branches.length) * 100) 
      : 0;
    
    // Calculate average participation
    let totalParticipation = 0;
    visits?.forEach(visit => {
      if (visit.total_employees_invited && visit.total_participants) {
        const participationRate = (visit.total_participants / visit.total_employees_invited) * 100;
        totalParticipation += participationRate;
      }
    });
    const avgParticipation = visits?.length ? Math.round(totalParticipation / visits.length) : 0;
    
    // Find top performer (BHR with most visits)
    const bhrVisitCounts: Record<string, {count: number, name: string}> = {};
    visits?.forEach(visit => {
      const bhrId = visit.user_id;
      const bhrName = visit.profiles?.full_name || 'Unknown';
      
      if (!bhrVisitCounts[bhrId]) {
        bhrVisitCounts[bhrId] = { count: 0, name: bhrName };
      }
      
      bhrVisitCounts[bhrId].count += 1;
    });
    
    let topPerformerName = "N/A";
    let maxVisits = 0;
    
    Object.values(bhrVisitCounts).forEach(bhr => {
      if (bhr.count > maxVisits) {
        maxVisits = bhr.count;
        topPerformerName = bhr.name;
      }
    });
    
    return {
      totalBranchVisits,
      coveragePercentage,
      avgParticipation,
      topPerformer: topPerformerName
    };
  } catch (error: any) {
    console.error("Error fetching monthly summary:", error);
    toast({
      variant: "destructive",
      title: "Error loading summary",
      description: error.message || "Unable to load monthly summary report"
    });
    return {
      totalBranchVisits: 0,
      coveragePercentage: 0,
      avgParticipation: 0,
      topPerformer: "N/A"
    };
  }
}

/**
 * Fetches category breakdown data
 * @param month The month to get data for
 * @param year The year to get data for
 */
export async function fetchCategoryBreakdown(
  month: string, 
  year: string
): Promise<CategoryBreakdown[]> {
  try {
    // Get the numeric month value (0-11)
    const months = ["January", "February", "March", "April", "May", "June", "July", 
      "August", "September", "October", "November", "December"];
    const monthIndex = months.indexOf(month);
    if (monthIndex === -1) throw new Error("Invalid month name");
    
    // Create date range for the query
    const startDate = new Date(parseInt(year), monthIndex, 1);
    const endDate = new Date(parseInt(year), monthIndex + 1, 0); // Last day of month
    
    // Format dates for Supabase query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get all branches grouped by category
    const { data: branchCategories, error: branchError } = await supabase
      .from('branches')
      .select('category, count')
      .group('category');
      
    if (branchError) throw branchError;
    
    // Get branch visits in the month
    const { data: visits, error } = await supabase
      .from('branch_visits')
      .select(`branch_id, branch_category`)
      .gte('visit_date', startDateStr)
      .lte('visit_date', endDateStr);
      
    if (error) throw error;
    
    // Count visits per category
    const visitsByCategory: Record<string, Set<string>> = {};
    visits?.forEach(visit => {
      if (!visitsByCategory[visit.branch_category]) {
        visitsByCategory[visit.branch_category] = new Set();
      }
      visitsByCategory[visit.branch_category].add(visit.branch_id);
    });
    
    // Count visits per branch
    const visitCountByBranch: Record<string, number> = {};
    visits?.forEach(visit => {
      if (!visitCountByBranch[visit.branch_id]) {
        visitCountByBranch[visit.branch_id] = 0;
      }
      visitCountByBranch[visit.branch_id] += 1;
    });
    
    // Get all branches
    const { data: allBranches, error: allBranchesError } = await supabase
      .from('branches')
      .select('id, category');
      
    if (allBranchesError) throw allBranchesError;
    
    // Count branches by category
    const branchesByCategory: Record<string, number> = {};
    allBranches?.forEach(branch => {
      if (!branchesByCategory[branch.category]) {
        branchesByCategory[branch.category] = 0;
      }
      branchesByCategory[branch.category] += 1;
    });
    
    // Calculate metrics for each category
    const categories = ['platinum', 'diamond', 'gold', 'silver', 'bronze'];
    const result: CategoryBreakdown[] = categories.map(category => {
      // Get total branches in this category
      const totalBranches = branchesByCategory[category] || 0;
      
      // Get visited branches in this category
      const visitedBranches = visitsByCategory[category]?.size || 0;
      
      // Calculate coverage
      const coverage = totalBranches ? Math.round((visitedBranches / totalBranches) * 100) : 0;
      
      // Calculate average visits per branch
      const branchesInCategory = allBranches?.filter(b => b.category === category) || [];
      let totalVisits = 0;
      
      branchesInCategory.forEach(branch => {
        totalVisits += visitCountByBranch[branch.id] || 0;
      });
      
      const averageVisits = totalBranches ? parseFloat((totalVisits / totalBranches).toFixed(1)) : 0;
      
      return {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        branches: totalBranches,
        coverage,
        averageVisits
      };
    });
    
    return result;
  } catch (error: any) {
    console.error("Error fetching category breakdown:", error);
    toast({
      variant: "destructive",
      title: "Error loading category data",
      description: error.message || "Unable to load category breakdown"
    });
    return [];
  }
}

/**
 * Exports branch visit data to CSV
 */
export async function exportBranchVisitData(
  month?: string,
  year?: string,
  location?: string,
  category?: string,
  bhrId?: string
) {
  try {
    let query = supabase
      .from('branch_visits')
      .select(`
        *,
        branches:branch_id (
          name,
          location,
          category,
          branch_code
        ),
        profiles:user_id (
          full_name,
          e_code
        )
      `);
      
    // Apply filters
    if (month && year) {
      const months = ["January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December"];
      const monthIndex = months.indexOf(month);
      
      if (monthIndex > -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0);
        
        query = query
          .gte('visit_date', startDate.toISOString().split('T')[0])
          .lte('visit_date', endDate.toISOString().split('T')[0]);
      }
    }
    
    if (location) {
      query = query.eq('branches.location', location);
    }
    
    if (category) {
      query = query.eq('branch_category', category);
    }
    
    if (bhrId) {
      query = query.eq('user_id', bhrId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Format data for export
    return data?.map(visit => ({
      'Visit Date': visit.visit_date,
      'Branch Name': visit.branches?.name || 'Unknown',
      'Branch Code': visit.branches?.branch_code || 'Unknown',
      'Branch Location': visit.branches?.location || 'Unknown',
      'Branch Category': visit.branch_category || 'Unknown',
      'BHR Name': visit.profiles?.full_name || 'Unknown',
      'BHR Code': visit.profiles?.e_code || 'Unknown',
      'Status': visit.status || 'Unknown',
      'HR Connect Session': visit.hr_connect_session ? 'Yes' : 'No',
      'Total Employees Invited': visit.total_employees_invited || 0,
      'Total Participants': visit.total_participants || 0,
      'Participation Rate': visit.total_employees_invited 
        ? `${((visit.total_participants / visit.total_employees_invited) * 100).toFixed(1)}%` 
        : '0%',
      'Manning %': `${visit.manning_percentage || 0}%`,
      'Attrition %': `${visit.attrition_percentage || 0}%`,
      'Non-Vendor %': `${visit.non_vendor_percentage || 0}%`,
      'ER %': `${visit.er_percentage || 0}%`,
      'CWT Cases': visit.cwt_cases || 0
    })) || [];
  } catch (error: any) {
    console.error("Error exporting branch visit data:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Unable to export branch visit data"
    });
    return [];
  }
}

/**
 * Exports BHR performance summary data to CSV
 */
export async function exportBHRPerformanceSummary(
  month?: string,
  year?: string
) {
  try {
    // Get all BHRs
    const { data: bhrs, error: bhrError } = await supabase
      .from('profiles')
      .select('id, full_name, e_code')
      .eq('role', 'BH');
      
    if (bhrError) throw bhrError;
    if (!bhrs?.length) return [];
    
    let dateFilter = {};
    
    // Apply date filters if provided
    if (month && year) {
      const months = ["January", "February", "March", "April", "May", "June", "July", 
        "August", "September", "October", "November", "December"];
      const monthIndex = months.indexOf(month);
      
      if (monthIndex > -1) {
        const startDate = new Date(parseInt(year), monthIndex, 1);
        const endDate = new Date(parseInt(year), monthIndex + 1, 0);
        
        dateFilter = {
          gte: startDate.toISOString().split('T')[0],
          lte: endDate.toISOString().split('T')[0]
        };
      }
    }
    
    // Get performance data for each BHR
    const bhrPerformance = await Promise.all(
      bhrs.map(async (bhr) => {
        // Get all visits by this BHR
        const { data: visits, error } = await supabase
          .from('branch_visits')
          .select('*, branches:branch_id (category)')
          .eq('user_id', bhr.id)
          ...(Object.keys(dateFilter).length > 0 
            ? [
                'visit_date', 
                dateFilter
              ]
            : []);
          
        if (error) throw error;
        
        // Calculate metrics
        const totalVisits = visits?.length || 0;
        const uniqueBranches = new Set(visits?.map(v => v.branch_id) || []);
        
        // Count visits by category
        const visitsByCategory: Record<string, number> = {
          platinum: 0,
          diamond: 0,
          gold: 0,
          silver: 0,
          bronze: 0
        };
        
        visits?.forEach(visit => {
          const category = visit.branch_category?.toLowerCase();
          if (category && visitsByCategory.hasOwnProperty(category)) {
            visitsByCategory[category] += 1;
          }
        });
        
        // Calculate average participation rate
        let totalParticipation = 0;
        visits?.forEach(visit => {
          if (visit.total_employees_invited && visit.total_participants) {
            const participationRate = (visit.total_participants / visit.total_employees_invited) * 100;
            totalParticipation += participationRate;
          }
        });
        
        const avgParticipation = totalVisits ? (totalParticipation / totalVisits).toFixed(1) : '0';
        
        // Count status
        const statusCounts = {
          approved: 0,
          rejected: 0,
          submitted: 0
        };
        
        visits?.forEach(visit => {
          if (visit.status && statusCounts.hasOwnProperty(visit.status)) {
            statusCounts[visit.status as keyof typeof statusCounts] += 1;
          }
        });
        
        return {
          'BHR Name': bhr.full_name,
          'BHR Code': bhr.e_code,
          'Total Visits': totalVisits,
          'Unique Branches Visited': uniqueBranches.size,
          'Platinum Visits': visitsByCategory.platinum,
          'Diamond Visits': visitsByCategory.diamond,
          'Gold Visits': visitsByCategory.gold,
          'Silver Visits': visitsByCategory.silver,
          'Bronze Visits': visitsByCategory.bronze,
          'Avg. Participation Rate': `${avgParticipation}%`,
          'Approved Reports': statusCounts.approved,
          'Rejected Reports': statusCounts.rejected,
          'Pending Reports': statusCounts.submitted
        };
      })
    );
    
    return bhrPerformance;
  } catch (error: any) {
    console.error("Error exporting BHR performance data:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Unable to export BHR performance data"
    });
    return [];
  }
}

/**
 * Exports branch assignment data to CSV
 */
export async function exportBranchAssignments() {
  try {
    // Get BHRs with their assigned branches
    const { data: mappings, error } = await supabase
      .from('bhr_branch_mappings')
      .select(`
        profiles:bhr_id (
          full_name,
          e_code
        ),
        branches:branch_id (
          name,
          location,
          category,
          branch_code
        )
      `);
      
    if (error) throw error;
    
    // Format data for export
    return mappings?.map(mapping => ({
      'BHR Name': mapping.profiles?.full_name || 'Unknown',
      'BHR Code': mapping.profiles?.e_code || 'Unknown',
      'Branch Name': mapping.branches?.name || 'Unknown',
      'Branch Code': mapping.branches?.branch_code || 'Unknown',
      'Branch Location': mapping.branches?.location || 'Unknown',
      'Branch Category': mapping.branches?.category || 'Unknown'
    })) || [];
  } catch (error: any) {
    console.error("Error exporting branch assignments:", error);
    toast({
      variant: "destructive",
      title: "Export failed",
      description: error.message || "Unable to export branch assignments"
    });
    return [];
  }
}
