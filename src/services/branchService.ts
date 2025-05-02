
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";

type Branch = Database['public']['Tables']['branches']['Row'];

// Fetch all branches
export const getAllBranches = async () => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching branches:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branches",
      description: error.message || "Unable to fetch branches"
    });
    return [];
  }
};

// Fetch branches by zone ID
export const getBranchesByZone = async (zoneId: string) => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('zone_id', zoneId)
      .order('name');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching branches by zone:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branches",
      description: error.message || "Unable to fetch branches for the selected zone"
    });
    return [];
  }
};

// Fetch branches by user ID (assigned branches)
export const getBranchesByUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches (*)
      `)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }

    const branchList = data?.map(item => item.branches) || [];
    return branchList;
  } catch (error: any) {
    console.error("Error fetching assigned branches:", error);
    toast({
      variant: "destructive",
      title: "Error fetching assigned branches",
      description: error.message || "Unable to fetch your assigned branches"
    });
    return [];
  }
};

// Fetch branch details by ID
export const getBranchById = async (branchId: string) => {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', branchId)
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error: any) {
    console.error("Error fetching branch details:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branch details",
      description: error.message || "Unable to fetch branch details"
    });
    return null;
  }
};

// Get visit metrics across branches for analytics
export const getVisitMetrics = async (dateRange?: { from: Date; to: Date } | undefined) => {
  try {
    let query = supabase.from('branch_visits')
      .select(`
        branch_category,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        cwt_cases
      `);
    
    // Apply date filter if provided
    if (dateRange?.from && dateRange?.to) {
      query = query
        .gte('visit_date', dateRange.from.toISOString().split('T')[0])
        .lte('visit_date', dateRange.to.toISOString().split('T')[0]);
    }
    
    // Only include submitted or approved visits
    query = query.in('status', ['submitted', 'approved']);
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Group data by branch category
    const categoryData: Record<string, {
      count: number;
      manningSum: number;
      attritionSum: number;
      erSum: number;
      cwtSum: number;
    }> = {};
    
    data.forEach(visit => {
      const category = visit.branch_category || 'unknown';
      
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          manningSum: 0,
          attritionSum: 0,
          erSum: 0,
          cwtSum: 0
        };
      }
      
      categoryData[category].count++;
      
      if (typeof visit.manning_percentage === 'number') {
        categoryData[category].manningSum += visit.manning_percentage;
      }
      
      if (typeof visit.attrition_percentage === 'number') {
        categoryData[category].attritionSum += visit.attrition_percentage;
      }
      
      if (typeof visit.er_percentage === 'number') {
        categoryData[category].erSum += visit.er_percentage;
      }
      
      if (typeof visit.cwt_cases === 'number') {
        categoryData[category].cwtSum += visit.cwt_cases;
      }
    });
    
    // Format the data for the charts
    const metrics = Object.entries(categoryData).map(([name, data]) => {
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        manning: Math.round(data.manningSum / data.count),
        attrition: Math.round(data.attritionSum / data.count),
        er: Math.round(data.erSum / data.count),
        cwt: data.cwtSum
      };
    });
    
    console.info("Category metrics:", metrics);
    return metrics;
  } catch (error) {
    console.error("Error getting visit metrics:", error);
    return [];
  }
};

// Get visit metrics for a specific BH user
export const getBHVisitMetrics = async (userId: string) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    // For BH Dashboard we need specific metrics
    const { data: visits, error } = await supabase
      .from('branch_visits')
      .select(`
        hr_connect_session,
        total_employees_invited,
        total_participants,
        new_employees_total,
        new_employees_covered
      `)
      .eq('user_id', userId)
      .in('status', ['submitted', 'approved']);
      
    if (error) throw error;
    
    if (!visits || visits.length === 0) {
      return {
        hrConnectSessions: { completed: 0, total: 0 },
        avgParticipation: 0,
        employeeCoverage: 0,
        newEmployeeCoverage: 0
      };
    }
    
    // Calculate HR Connect sessions
    const hrSessions = visits.filter(v => v.hr_connect_session === true).length;
    
    // Calculate average participation
    const totalInvited = visits.reduce((sum, v) => sum + (v.total_employees_invited || 0), 0);
    const totalParticipated = visits.reduce((sum, v) => sum + (v.total_participants || 0), 0);
    const avgParticipation = totalInvited > 0 ? Math.round((totalParticipated / totalInvited) * 100) : 0;
    
    // Calculate new employee coverage
    const newTotal = visits.reduce((sum, v) => sum + (v.new_employees_total || 0), 0);
    const newCovered = visits.reduce((sum, v) => sum + (v.new_employees_covered || 0), 0);
    const newEmployeeCoverage = newTotal > 0 ? Math.round((newCovered / newTotal) * 100) : 0;
    
    return {
      hrConnectSessions: { completed: hrSessions, total: visits.length },
      avgParticipation,
      employeeCoverage: avgParticipation, // Same as participation for now
      newEmployeeCoverage
    };
  } catch (error) {
    console.error("Error getting BH visit metrics:", error);
    return {
      hrConnectSessions: { completed: 0, total: 0 },
      avgParticipation: 0,
      employeeCoverage: 0,
      newEmployeeCoverage: 0
    };
  }
};
