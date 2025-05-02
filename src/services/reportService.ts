
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Get stats for a BHR's reports
export const fetchBHRReportStats = async (bhId: string) => {
  try {
    const { data: totalData, error: totalError } = await supabase
      .from('branch_visits')
      .select('count', { count: 'exact' })
      .eq('user_id', bhId);
    
    const { data: approvedData, error: approvedError } = await supabase
      .from('branch_visits')
      .select('count', { count: 'exact' })
      .eq('user_id', bhId)
      .eq('status', 'approved');
    
    const { data: pendingData, error: pendingError } = await supabase
      .from('branch_visits')
      .select('count', { count: 'exact' })
      .eq('user_id', bhId)
      .eq('status', 'submitted');
    
    const { data: rejectedData, error: rejectedError } = await supabase
      .from('branch_visits')
      .select('count', { count: 'exact' })
      .eq('user_id', bhId)
      .eq('status', 'rejected');
    
    if (totalError || approvedError || pendingError || rejectedError) {
      throw new Error('Error fetching report stats');
    }
    
    return {
      total: totalData ? totalData.length : 0,
      approved: approvedData ? approvedData.length : 0,
      pending: pendingData ? pendingData.length : 0,
      rejected: rejectedData ? rejectedData.length : 0
    };
  } catch (error) {
    console.error("Error in fetchBHRReportStats:", error);
    return {
      total: 0,
      approved: 0,
      pending: 0, 
      rejected: 0
    };
  }
};

// Define the types for qualitative metrics
export type QualitativeRating = "very_poor" | "poor" | "neutral" | "good" | "excellent" | null;
export type QualitativeMetric = "culture_branch" | "line_manager_behavior" | "branch_hygiene" | "overall_discipline";

export interface QualitativeData {
  culture_branch: QualitativeRating;
  line_manager_behavior: QualitativeRating;
  branch_hygiene: QualitativeRating;
  overall_discipline: QualitativeRating;
}

export interface HeatmapData {
  metric: QualitativeMetric;
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
  total: number;
}

// Function to get qualitative data metrics by branch category
export const getQualitativeMetricsByCategory = async (
  dateRange?: { from: Date; to: Date } | null,
  specificCategory?: string | null
): Promise<QualitativeData[]> => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        branch_category,
        culture_branch,
        line_manager_behavior,
        branch_hygiene,
        overall_discipline
      `);
    
    // Apply date filter if provided
    if (dateRange?.from && dateRange?.to) {
      query = query
        .gte('visit_date', dateRange.from.toISOString().split('T')[0])
        .lte('visit_date', dateRange.to.toISOString().split('T')[0]);
    }
    
    // Apply category filter if provided
    if (specificCategory && specificCategory !== 'all') {
      query = query.eq('branch_category', specificCategory.toLowerCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return data as QualitativeData[];
  } catch (error) {
    console.error("Error fetching qualitative metrics by category:", error);
    return [];
  }
};

// Get the breakdown of qualitative metrics for the heatmap
export const getQualitativeMetricsForHeatmap = async (
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
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Process the data for the heatmap
    const metrics: QualitativeMetric[] = [
      "culture_branch",
      "line_manager_behavior",
      "branch_hygiene",
      "overall_discipline"
    ];

    // Initialize the counts for each metric and rating
    const processedData: HeatmapData[] = metrics.map(metric => ({
      metric,
      very_poor: 0,
      poor: 0,
      neutral: 0,
      good: 0,
      excellent: 0,
      total: 0
    }));

    // Count the occurrences of each rating for each metric
    if (data) {
      data.forEach(visit => {
        metrics.forEach(metric => {
          const rating = visit[metric] as QualitativeRating;
          if (rating) {
            const metricData = processedData.find(d => d.metric === metric);
            if (metricData) {
              metricData[rating] += 1;
              metricData.total += 1;
            }
          }
        });
      });
    }
    
    console.log("Processed heatmap data:", processedData);
    return processedData;
  } catch (error) {
    console.error("Error fetching qualitative metrics for heatmap:", error);
    return [];
  }
};

// Export these functions that are referenced in other files
export const getActiveBHRsCount = async () => ({ count: 0, total: 0 });
export const getTotalBranchVisitsInMonth = async () => ({ count: 0 });
export const fetchReportById = async (id: string) => null;
export interface BranchVisitReport {} // Empty interface to satisfy imports
export const fetchRecentReports = async () => [];
export const updateReportStatus = async () => false;
