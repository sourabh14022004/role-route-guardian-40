import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { fetchMonthlyTrends } from "@/services/analyticsService";

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

// Fetch user branch visits (for My Visits page)
export const fetchUserBranchVisits = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        *,
        branches (
          name,
          location,
          category
        )
      `)
      .eq('user_id', userId)
      .order('visit_date', { ascending: false });
      
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error: any) {
    console.error("Error fetching user branch visits:", error);
    toast({
      variant: "destructive",
      title: "Error fetching visits",
      description: error.message || "Unable to fetch your branch visits"
    });
    return [];
  }
};

// Fetch assigned branches with details (for New Visit page)
export const fetchAssignedBranchesWithDetails = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches (
          id,
          name,
          location,
          category,
          zone_id
        )
      `)
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    // Transform data structure for easier consumption
    const branchesWithDetails = data?.map(item => ({
      id: item.branches?.id,
      name: item.branches?.name,
      location: item.branches?.location,
      category: item.branches?.category,
      zoneId: item.branches?.zone_id
    })) || [];
    
    return branchesWithDetails;
  } catch (error: any) {
    console.error("Error fetching assigned branches:", error);
    toast({
      variant: "destructive",
      title: "Error fetching branches",
      description: error.message || "Unable to fetch your assigned branches"
    });
    return [];
  }
};

// Create a new branch visit
export const createBranchVisit = async (visitData: any) => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .insert(visitData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (error: any) {
    console.error("Error creating branch visit:", error);
    toast({
      variant: "destructive",
      title: "Error saving visit",
      description: error.message || "Unable to save branch visit data"
    });
    return { success: false, error };
  }
};

// Get branch visit stats for BH Dashboard
export const getBranchVisitStats = async (userId: string) => {
  try {
    // Get total assigned branches
    const { data: assignedData, error: assignedError } = await supabase
      .from('branch_assignments')
      .select('branch_id')
      .eq('user_id', userId);
      
    if (assignedError) throw assignedError;
    
    const assignedBranches = assignedData?.length || 0;
    
    // Get branches visited this month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data: visitData, error: visitError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .eq('user_id', userId)
      .gte('visit_date', firstDay)
      .lte('visit_date', lastDay);
      
    if (visitError) throw visitError;
    
    // Count unique branches visited
    const uniqueBranchesVisited = new Set(visitData?.map(v => v.branch_id)).size;
    
    // Calculate completion rate
    const completionRate = assignedBranches > 0 
      ? Math.round((uniqueBranchesVisited / assignedBranches) * 100)
      : 0;
    
    // Get pending visits (branches not visited yet this month)
    const pendingVisits = assignedBranches - uniqueBranchesVisited;
    
    return {
      assignedBranches,
      branchesVisited: uniqueBranchesVisited,
      pendingVisits: pendingVisits > 0 ? pendingVisits : 0,
      completionRate
    };
  } catch (error) {
    console.error("Error getting branch visit stats:", error);
    return {
      assignedBranches: 0,
      branchesVisited: 0,
      pendingVisits: 0,
      completionRate: 0
    };
  }
};

// Get coverage by branch category for BH Dashboard
export const getBranchCategoryCoverage = async (userId: string) => {
  try {
    // Get all assigned branches by category
    const { data: assignedBranches, error: assignedError } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches (
          id,
          category
        )
      `)
      .eq('user_id', userId);
      
    if (assignedError) throw assignedError;
    
    // Group assigned branches by category
    const assignedByCategory: Record<string, string[]> = {};
    assignedBranches?.forEach(item => {
      if (!item.branches || !item.branches.category) return;
      
      const category = item.branches.category || 'unknown';
      if (!assignedByCategory[category]) {
        assignedByCategory[category] = [];
      }
      if (item.branches.id) {
        assignedByCategory[category].push(item.branches.id);
      }
    });
    
    // Get current month's visits
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, branch_category')
      .eq('user_id', userId)
      .gte('visit_date', firstDay)
      .lte('visit_date', lastDay);
      
    if (visitsError) throw visitsError;
    
    // Count visits by category
    const visitsByCategory: Record<string, Set<string>> = {};
    visits?.forEach(visit => {
      if (!visit.branch_category || !visit.branch_id) return;
      
      const category = visit.branch_category;
      if (!visitsByCategory[category]) {
        visitsByCategory[category] = new Set();
      }
      visitsByCategory[category].add(visit.branch_id);
    });
    
    // Calculate completion percentage for each category
    const categoryCoverage = [
      { category: 'platinum', completion: 0, color: 'bg-violet-500' },
      { category: 'diamond', completion: 0, color: 'bg-blue-500' },
      { category: 'gold', completion: 0, color: 'bg-amber-500' },
      { category: 'silver', completion: 0, color: 'bg-slate-400' },
      { category: 'bronze', completion: 0, color: 'bg-orange-700' }
    ];
    
    categoryCoverage.forEach(cat => {
      const assigned = assignedByCategory[cat.category]?.length || 0;
      const visited = visitsByCategory[cat.category]?.size || 0;
      
      cat.completion = assigned > 0 ? Math.round((visited / assigned) * 100) : 0;
    });
    
    return categoryCoverage;
  } catch (error) {
    console.error("Error getting branch category coverage:", error);
    return [
      { category: 'platinum', completion: 0, color: 'bg-violet-500' },
      { category: 'diamond', completion: 0, color: 'bg-blue-500' },
      { category: 'gold', completion: 0, color: 'bg-amber-500' },
      { category: 'silver', completion: 0, color: 'bg-slate-400' },
      { category: 'bronze', completion: 0, color: 'bg-orange-700' }
    ];
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

// Get coverage and participation data for Coverage & Participation Trends chart
export const getCoverageParticipationTrends = async (timeRange = 'lastSixMonths') => {
  console.info("Fetching coverage and participation trends...");
  
  try {
    // Determine date range based on timeRange
    let startDate = new Date();
    const endDate = new Date();
    
    switch(timeRange) {
      case 'lastMonth':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'lastThreeMonths':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'lastSixMonths':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'lastYear':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Format dates for query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get total branches count for coverage calculation
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id', { count: 'exact' });
    
    if (branchError) throw branchError;
    const totalBranches = branches?.length || 0;
    
    // Get all visits within the date range grouped by month
    const { data: visits, error: visitError } = await supabase
      .from('branch_visits')
      .select(`
        visit_date,
        branch_id,
        total_employees_invited,
        total_participants
      `)
      .gte('visit_date', startDateStr)
      .lte('visit_date', endDateStr)
      .in('status', ['submitted', 'approved']);
    
    if (visitError) throw visitError;
    
    if (!visits || visits.length === 0) {
      return [];
    }
    
    // Group visits by month
    const visitsByMonth: Record<string, {
      visits: typeof visits,
      uniqueBranches: Set<string>,
      totalInvited: number,
      totalParticipated: number
    }> = {};
    
    visits.forEach(visit => {
      const visitDate = new Date(visit.visit_date);
      const monthYear = `${visitDate.getFullYear()}-${String(visitDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!visitsByMonth[monthYear]) {
        visitsByMonth[monthYear] = {
          visits: [],
          uniqueBranches: new Set(),
          totalInvited: 0,
          totalParticipated: 0
        };
      }
      
      visitsByMonth[monthYear].visits.push(visit);
      visitsByMonth[monthYear].uniqueBranches.add(visit.branch_id);
      visitsByMonth[monthYear].totalInvited += (visit.total_employees_invited || 0);
      visitsByMonth[monthYear].totalParticipated += (visit.total_participants || 0);
    });
    
    // Convert to array and format for chart
    const trendsData = Object.entries(visitsByMonth).map(([monthYear, data]) => {
      const [year, month] = monthYear.split('-').map(Number);
      const date = new Date(year, month - 1);
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      const branchCoverage = totalBranches > 0 ? 
        Math.round((data.uniqueBranches.size / totalBranches) * 100) : 0;
        
      const participationRate = data.totalInvited > 0 ?
        Math.round((data.totalParticipated / data.totalInvited) * 100) : 0;
      
      return {
        month: `${monthName} ${year}`,
        branchCoverage,
        participationRate
      };
    });
    
    // Sort by date
    trendsData.sort((a, b) => {
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
    console.info("Trends data:", trendsData);
    return trendsData;
  } catch (error) {
    console.error("Error fetching coverage and participation trends:", error);
    toast({
      variant: "destructive",
      title: "Error fetching trends",
      description: "Could not load coverage and participation data"
    });
    return [];
  }
};

// Get performance trend data for Performance Trend chart
export const getPerformanceTrends = async (timeRange = 'lastSevenDays') => {
  console.log("Fetching performance trends with timeRange:", timeRange);
  try {
    // Use the analytics service to get monthly trends
    const trendsData = await fetchMonthlyTrends(timeRange);
    console.log("Performance trends data:", trendsData);
    return trendsData;
  } catch (error) {
    console.error("Error fetching performance trends:", error);
    toast({
      title: "Error",
      description: "Failed to load performance trends data",
      variant: "destructive"
    });
    return []; // Return empty array on error
  }
};
