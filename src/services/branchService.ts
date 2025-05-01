import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

// Get stats about branch visits for a BH user
export const getBranchVisitStats = async (userId: string) => {
  try {
    // Get assigned branches
    const { data: branchAssignments, error: assignmentError } = await supabase
      .from("branch_assignments")
      .select("branch_id")
      .eq("user_id", userId);
    
    if (assignmentError) throw assignmentError;
    
    const assignedBranches = branchAssignments?.length || 0;
    
    // Get visited branches
    const { data: branchVisits, error: visitsError } = await supabase
      .from("branch_visits")
      .select("branch_id, status")
      .eq("user_id", userId);
    
    if (visitsError) throw visitsError;
    
    // Count unique branches visited
    const visitedBranchIds = new Set(branchVisits?.map(visit => visit.branch_id) || []);
    const branchesVisited = visitedBranchIds.size;
    
    // Count pending visits
    const pendingVisits = branchVisits?.filter(visit => visit.status === "submitted" || visit.status === "draft").length || 0;
    
    // Calculate completion rate
    const completionRate = assignedBranches > 0 ? Math.round((branchesVisited / assignedBranches) * 100) : 0;
    
    return {
      assignedBranches,
      branchesVisited,
      pendingVisits,
      completionRate,
    };
  } catch (error) {
    console.error("Error fetching branch visit stats:", error);
    return {
      assignedBranches: 0,
      branchesVisited: 0,
      pendingVisits: 0,
      completionRate: 0,
    };
  }
};

// Get branch category coverage stats
export const getBranchCategoryCoverage = async (userId: string) => {
  try {
    // Get assigned branches with their categories
    const { data: assignedBranches, error: assignmentError } = await supabase
      .from("branch_assignments")
      .select(`
        branch_id,
        branches:branch_id (
          category
        )
      `)
      .eq("user_id", userId);
    
    if (assignmentError) throw assignmentError;
    
    // Get visited branches
    const { data: branchVisits, error: visitsError } = await supabase
      .from("branch_visits")
      .select("branch_id")
      .eq("user_id", userId);
    
    if (visitsError) throw visitsError;
    
    // Set of visited branch ids
    const visitedBranchIds = new Set(branchVisits?.map(visit => visit.branch_id) || []);
    
    // Count by category
    const categoryCounts: Record<string, { total: number, visited: number }> = {};
    
    assignedBranches?.forEach(assignment => {
      const category = assignment.branches?.category || "unknown";
      if (!categoryCounts[category]) {
        categoryCounts[category] = { total: 0, visited: 0 };
      }
      categoryCounts[category].total += 1;
      
      if (visitedBranchIds.has(assignment.branch_id)) {
        categoryCounts[category].visited += 1;
      }
    });
    
    // Calculate completion percentage for each category
    return Object.entries(categoryCounts).map(([category, counts]) => {
      const completion = counts.total > 0 ? Math.round((counts.visited / counts.total) * 100) : 0;
      
      // Assign color based on category
      let color = "bg-orange-500";
      switch (category) {
        case "platinum":
          color = "bg-violet-500";
          break;
        case "diamond":
          color = "bg-blue-500";
          break;
        case "gold":
          color = "bg-amber-500";
          break;
        case "silver":
          color = "bg-slate-400";
          break;
      }
      
      return { category, completion, color };
    });
  } catch (error) {
    console.error("Error fetching branch category coverage:", error);
    return [
      { category: "platinum", completion: 0, color: "bg-violet-500" },
      { category: "diamond", completion: 0, color: "bg-blue-500" },
      { category: "gold", completion: 0, color: "bg-amber-500" },
      { category: "silver", completion: 0, color: "bg-slate-400" },
      { category: "bronze", completion: 0, color: "bg-orange-700" },
    ];
  }
};

// Get metrics for visits
export const getVisitMetrics = async (userId: string) => {
  try {
    // Get all visits
    const { data: visits, error } = await supabase
      .from("branch_visits")
      .select("*")
      .eq("user_id", userId);
    
    if (error) throw error;
    
    // Calculate HR connect sessions
    const hrSessions = visits?.filter(visit => visit.hr_connect_session) || [];
    
    // Calculate average participation
    const participationRates = visits
      ?.filter(visit => visit.total_employees_invited && visit.total_participants)
      ?.map(visit => visit.total_participants / visit.total_employees_invited) || [];
    
    const avgParticipation = participationRates.length > 0
      ? Math.round(
          (participationRates.reduce((sum, rate) => sum + rate, 0) / participationRates.length) * 100
        )
      : 0;
    
    // Calculate employee coverage
    const totalEmployeeCoverage = visits
      ?.filter(visit => visit.total_employees_invited)
      ?.reduce((acc, visit) => acc + (visit.total_employees_invited || 0), 0) || 0;
    
    // Calculate new employee coverage
    const newEmployeeCoverageTotal = visits
      ?.filter(visit => visit.new_employees_total && visit.new_employees_covered)
      ?.reduce((acc, visit) => ({
        total: acc.total + (visit.new_employees_total || 0),
        covered: acc.covered + (visit.new_employees_covered || 0)
      }), { total: 0, covered: 0 });
    
    const newEmployeeCoverage = newEmployeeCoverageTotal.total > 0
      ? Math.round((newEmployeeCoverageTotal.covered / newEmployeeCoverageTotal.total) * 100)
      : 0;
    
    return {
      hrConnectSessions: {
        completed: hrSessions.length,
        total: visits?.length || 0
      },
      avgParticipation,
      employeeCoverage: totalEmployeeCoverage,
      newEmployeeCoverage
    };
  } catch (error) {
    console.error("Error fetching visit metrics:", error);
    return {
      hrConnectSessions: { completed: 0, total: 0 },
      avgParticipation: 0,
      employeeCoverage: 0,
      newEmployeeCoverage: 0
    };
  }
};

// Add a new function to calculate active BHRs (those who submitted reports in the current month)
export const getActiveBHRCount = async () => {
  try {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate).toISOString();
    const monthEnd = endOfMonth(currentDate).toISOString();
    
    // Get unique user IDs who submitted reports this month
    const { data, error } = await supabase
      .from("branch_visits")
      .select("user_id")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd);
    
    if (error) throw error;
    
    // Count unique BHRs
    const uniqueBHRs = new Set(data?.map(visit => visit.user_id) || []);
    
    return uniqueBHRs.size;
  } catch (error) {
    console.error("Error calculating active BHRs:", error);
    return 0;
  }
};

// Add the missing functions that are imported in other components

// Fetch assigned branches with details
export const fetchAssignedBranchesWithDetails = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("branch_assignments")
      .select(`
        branch_id,
        branches:branch_id (
          id,
          name,
          location,
          category,
          status
        )
      `)
      .eq("user_id", userId);
    
    if (error) throw error;
    
    // Transform the data to make it easier to work with
    const branches = data?.map(item => ({
      id: item.branch_id,
      ...item.branches
    })) || [];
    
    return branches;
  } catch (error) {
    console.error("Error fetching assigned branches:", error);
    return [];
  }
};

// Create a branch visit record
export const createBranchVisit = async (visitData: any) => {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .insert(visitData)
      .select();
    
    if (error) throw error;
    
    return data[0];
  } catch (error) {
    console.error("Error creating branch visit:", error);
    throw error;
  }
};

// Fetch branch visits for a user
export const fetchUserBranchVisits = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches:branch_id (
          name,
          location,
          category
        )
      `)
      .eq("user_id", userId)
      .order("visit_date", { ascending: false });
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching user branch visits:", error);
    return [];
  }
};
