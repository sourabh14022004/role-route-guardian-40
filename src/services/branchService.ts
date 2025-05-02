
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Branch = Database['public']['Tables']['branches']['Row'];

export async function fetchBranches() {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
}

export async function getCoverageParticipationTrends(period: 'lastSixMonths' | 'lastYear' = 'lastSixMonths') {
  try {
    // Determine the start date based on the period
    let startDate = new Date();
    if (period === 'lastSixMonths') {
      startDate.setMonth(startDate.getMonth() - 6);
    } else if (period === 'lastYear') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    // Fetch branch visits and user participation rates
    const { data, error } = await supabase.rpc('get_coverage_participation_trends', {
      start_date: startDate.toISOString()
    });

    if (error) {
      console.error("Error fetching coverage and participation trends:", error);
      throw error;
    }

    // Transform the data to a more usable format
    const trendsData = data?.map(item => ({
      month: item.month,
      branchCoverage: parseFloat(item.branch_coverage),
      participationRate: parseFloat(item.participation_rate)
    })) || [];

    return trendsData;
  } catch (error) {
    console.error("Error in getCoverageParticipationTrends:", error);
    throw error;
  }
}

export async function fetchBranchesByZone(zoneId?: string) {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name, location, category, zone_id');
      
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching branches by zone:", error);
    throw error;
  }
}

export async function fetchBranchCategoriesDistribution() {
  try {
    // Fetch all branches with their categories
    const { data, error } = await supabase
      .from('branches')
      .select('id, category');
      
    if (error) throw error;
    
    // Calculate distribution
    const categoryCounts: Record<string, number> = {
      'platinum': 0,
      'diamond': 0, 
      'gold': 0,
      'silver': 0,
      'bronze': 0,
      'unknown': 0
    };
    
    data?.forEach(branch => {
      const category = (branch?.category?.toLowerCase() as string) || 'unknown';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    const result = Object.entries(categoryCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value
      }));
    
    return result;
  } catch (error) {
    console.error("Error fetching branch categories distribution:", error);
    return [];
  }
}

// Add these exported functions for other files that need them
export const getBranchVisitStats = async (userId?: string) => {
  try {
    if (!userId) return { total: 0, completed: 0, pending: 0 };
    
    // Get total branch visits
    const { count: totalCount, error: totalError } = await supabase
      .from('branch_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (totalError) throw totalError;
    
    // Get completed visits
    const { count: completedCount, error: completedError } = await supabase
      .from('branch_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');
    
    if (completedError) throw completedError;
    
    // Get pending visits
    const { count: pendingCount, error: pendingError } = await supabase
      .from('branch_visits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted');
    
    if (pendingError) throw pendingError;
    
    return { 
      total: totalCount || 0, 
      completed: completedCount || 0, 
      pending: pendingCount || 0 
    };
  } catch (error) {
    console.error("Error fetching branch visit stats:", error);
    return { total: 0, completed: 0, pending: 0 };
  }
};

export const getBranchCategoryCoverage = async () => {
  // Get coverage data for branch categories
  try {
    const { data, error } = await supabase.rpc('get_branch_category_coverage');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching branch category coverage:", error);
    return [];
  }
};

export const getVisitMetrics = async (userId?: string) => {
  try {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        branch_id,
        branches:branch_id (name, category)
      `)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching visit metrics:", error);
    return [];
  }
};

export const getBHVisitMetrics = async () => {
  try {
    // Get branch head visit metrics
    const { data, error } = await supabase.rpc('get_bh_visit_metrics');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching BH visit metrics:", error);
    return [];
  }
};

export const getPerformanceTrends = async () => {
  try {
    // Get performance trends
    const { data, error } = await supabase.rpc('get_performance_trends');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    return [];
  }
};

export const fetchUserBranchVisits = async (userId: string) => {
  try {
    if (!userId) return [];
    
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        branches:branch_id (name, location, category)
      `)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user branch visits:", error);
    return [];
  }
};

export const getUserAssignedBranches = async (userId: string) => {
  try {
    // Get branch assignments for this user
    const { data: assignments, error: assignmentError } = await supabase
      .from('branch_assignments')
      .select('branch_id')
      .eq('user_id', userId);
      
    if (assignmentError) throw assignmentError;
    
    // If no assignments, return empty array
    if (!assignments || assignments.length === 0) {
      return [];
    }
    
    // Get branch details for the assigned branches
    const branchIds = assignments.map(assignment => assignment.branch_id);
    
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id, name, location, category')
      .in('id', branchIds);
      
    if (branchError) throw branchError;
    
    // Return the branch details
    return branches || [];
  } catch (error) {
    console.error("Error fetching user assigned branches:", error);
    // Return an empty array on error
    return [];
  }
};
