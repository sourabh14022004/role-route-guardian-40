
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

// Function to get qualitative data metrics by branch category
export const getQualitativeMetricsByCategory = async (
  dateRange?: { from: Date; to: Date } | null,
  specificCategory?: string | null
) => {
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
    
    // Process data by categories
    return data;
  } catch (error) {
    console.error("Error fetching qualitative metrics by category:", error);
    return [];
  }
};

// Get the breakdown of qualitative metrics for the heatmap
export const getQualitativeMetricsForHeatmap = async (
  dateRange?: { from: Date; to: Date } | null,
  branchCategory?: string | null
) => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        culture_branch,
        line_manager_behavior,
        branch_hygiene,
        overall_discipline
      `);
    
    // Apply filters
    if (dateRange?.from && dateRange?.to) {
      query = query
        .gte('visit_date', dateRange.from.toISOString().split('T')[0])
        .lte('visit_date', dateRange.to.toISOString().split('T')[0]);
    }
    
    if (branchCategory && branchCategory !== 'all') {
      query = query.eq('branch_category', branchCategory.toLowerCase());
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    console.log("Fetched qualitative data:", data);
    return data || [];
  } catch (error) {
    console.error("Error fetching qualitative metrics for heatmap:", error);
    return [];
  }
};
