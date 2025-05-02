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
export const getBranchVisitStats = async () => {
  // Return placeholder data
  return { total: 0, completed: 0, pending: 0 };
};

export const getBranchCategoryCoverage = async () => {
  // Return placeholder data for branch category coverage
  return [];
};

export const getVisitMetrics = async () => {
  // Return placeholder data for visit metrics
  return [];
};

export const getBHVisitMetrics = async () => {
  // Return placeholder data for BH visit metrics
  return [];
};

export const getPerformanceTrends = async () => {
  // Return placeholder data for performance trends
  return [];
};

export const fetchUserBranchVisits = async () => {
  // Return placeholder data for user branch visits
  return [];
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
