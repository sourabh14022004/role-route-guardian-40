
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Branch = Database["public"]["Tables"]["branches"]["Row"];
type BranchAssignment = Database["public"]["Tables"]["branch_assignments"]["Row"];
type BranchVisit = Database["public"]["Tables"]["branch_visits"]["Row"];

// Branches
export const fetchBranches = async (): Promise<Branch[]> => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error fetching branches:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load branches: ${error.message}`,
      });
      return [];
    }
  };
  
  export const getBranchById = async (branchId: string): Promise<Branch | null> => {
    try {
      const { data, error } = await supabase
        .from("branches")
        .select("*")
        .eq("id", branchId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error(`Error fetching branch ${branchId}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load branch details: ${error.message}`,
      });
      return null;
    }
  };
  
  // Branch Assignments
  export const fetchUserBranchAssignments = async (userId: string): Promise<BranchAssignment[]> => {
    try {
      const { data, error } = await supabase
        .from("branch_assignments")
        .select("*, branches(*)")
        .eq("user_id", userId);
      
      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error("Error fetching branch assignments:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load assigned branches: ${error.message}`,
      });
      return [];
    }
  };
  
  export const fetchAssignedBranchesWithDetails = async (userId: string): Promise<Branch[]> => {
    try {
      const { data, error } = await supabase
        .from("branch_assignments")
        .select(`
          branch_id,
          branches (*)
        `)
        .eq("user_id", userId);
      
      if (error) throw error;
      
      console.log("Fetched branch assignments:", data);
      
      // Extract branches from the nested structure
      if (!data || data.length === 0) {
        console.log("No branches found for user");
        return [];
      }
      
      // Extract branches properly from the nested data
      const branches = data
        .filter(item => item.branches) // Ensure branches exist
        .map(item => item.branches as Branch);
        
      console.log("Processed branches:", branches);
      
      return branches;
    } catch (error: any) {
      console.error("Error fetching assigned branches:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load assigned branches: ${error.message}`,
      });
      return [];
    }
  };
  
// Branch Visits
export const fetchUserBranchVisits = async (userId: string): Promise<BranchVisit[]> => {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches (name, location, category)
      `)
      .eq("user_id", userId)
      .order("visit_date", { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error("Error fetching branch visits:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to load branch visits: ${error.message}`,
    });
    return [];
  }
};

export const fetchVisitById = async (visitId: string): Promise<BranchVisit | null> => {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .select(`
        *,
        branches (name, location, category)
      `)
      .eq("id", visitId)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error(`Error fetching visit ${visitId}:`, error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to load visit details: ${error.message}`,
    });
    return null;
  }
};

export const createBranchVisit = async (visitData: Database["public"]["Tables"]["branch_visits"]["Insert"]): Promise<BranchVisit | null> => {
  try {
    const { data, error } = await supabase
      .from("branch_visits")
      .insert(visitData)
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Branch visit has been created",
    });
    
    return data;
  } catch (error: any) {
    console.error("Error creating branch visit:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to create branch visit: ${error.message}`,
    });
    return null;
  }
};

export const updateBranchVisit = async (visitId: string, visitData: Database["public"]["Tables"]["branch_visits"]["Update"]): Promise<BranchVisit | null> => {
  try {
    // Add updated_at timestamp
    const updatedData = {
      ...visitData,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from("branch_visits")
      .update(updatedData)
      .eq("id", visitId)
      .select()
      .single();
    
    if (error) throw error;
    
    toast({
      title: "Success",
      description: "Branch visit has been updated",
    });
    
    return data;
  } catch (error: any) {
    console.error(`Error updating visit ${visitId}:`, error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to update branch visit: ${error.message}`,
    });
    return null;
  }
};

export const getBranchVisitStats = async (userId: string): Promise<{
  assignedBranches: number;
  branchesVisited: number;
  pendingVisits: number;
  completionRate: number;
}> => {
  try {
    // Get assigned branches count
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("branch_assignments")
      .select("branch_id")
      .eq("user_id", userId);
    
    if (assignmentsError) throw assignmentsError;
    
    const assignedBranchIds = assignmentsData.map(assignment => assignment.branch_id);
    const assignedBranchesCount = assignedBranchIds.length;
    
    if (assignedBranchesCount === 0) {
      return {
        assignedBranches: 0,
        branchesVisited: 0,
        pendingVisits: 0,
        completionRate: 0
      };
    }
    
    // Get visited branches (distinct branch IDs from visits)
    const { data: visitsData, error: visitsError } = await supabase
      .from("branch_visits")
      .select("branch_id")
      .eq("user_id", userId)
      .in("branch_id", assignedBranchIds);
    
    if (visitsError) throw visitsError;
    
    // Get unique visited branch IDs
    const visitedBranchIds = [...new Set(visitsData.map(visit => visit.branch_id))];
    const branchesVisitedCount = visitedBranchIds.length;
    
    // Calculate pending and completion rate
    const pendingVisits = assignedBranchesCount - branchesVisitedCount;
    const completionRate = Math.round((branchesVisitedCount / assignedBranchesCount) * 100);
    
    return {
      assignedBranches: assignedBranchesCount,
      branchesVisited: branchesVisitedCount,
      pendingVisits: pendingVisits,
      completionRate: completionRate
    };
  } catch (error: any) {
    console.error("Error getting branch visit stats:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to load stats: ${error.message}`,
    });
    
    return {
      assignedBranches: 0,
      branchesVisited: 0,
      pendingVisits: 0,
      completionRate: 0
    };
  }
};

export const getBranchCategoryCoverage = async (userId: string): Promise<Array<{
  category: string;
  completion: number;
  color: string;
}>> => {
  try {
    // Default colors for categories
    const categoryColors: Record<string, string> = {
      platinum: "bg-violet-500",
      diamond: "bg-blue-500",
      gold: "bg-amber-500",
      silver: "bg-slate-400",
      bronze: "bg-orange-700"
    };
    
    // Get assigned branches per category
    const { data: assignedBranches, error: assignedError } = await supabase
      .from("branch_assignments")
      .select(`
        branch_id,
        branches (category)
      `)
      .eq("user_id", userId);
    
    if (assignedError) throw assignedError;
    
    // Count assigned branches by category
    const assignedByCategory: Record<string, string[]> = {};
    assignedBranches.forEach(item => {
      if (!item.branches) return;
      const category = item.branches.category;
      if (!assignedByCategory[category]) {
        assignedByCategory[category] = [];
      }
      assignedByCategory[category].push(item.branch_id);
    });
    
    // Get visited branches
    const { data: visits, error: visitsError } = await supabase
      .from("branch_visits")
      .select("branch_id, branches(category)")
      .eq("user_id", userId);
    
    if (visitsError) throw visitsError;
    
    // Count unique visited branches by category
    const visitedByCategory: Record<string, Set<string>> = {};
    visits.forEach(visit => {
      if (!visit.branches) return;
      const category = visit.branches.category;
      if (!visitedByCategory[category]) {
        visitedByCategory[category] = new Set();
      }
      visitedByCategory[category].add(visit.branch_id);
    });
    
    // Calculate completion rates by category
    const coverage = Object.keys(assignedByCategory).map(category => {
      const assigned = assignedByCategory[category].length;
      const visited = visitedByCategory[category] ? visitedByCategory[category].size : 0;
      const completion = assigned > 0 ? Math.round((visited / assigned) * 100) : 0;
      
      return {
        category,
        completion,
        color: categoryColors[category]
      };
    });
    
    return coverage;
  } catch (error: any) {
    console.error("Error getting branch category coverage:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to load category coverage: ${error.message}`,
    });
    
    // Return default structure with zeros
    return [
      { category: "Platinum", completion: 0, color: "bg-violet-500" },
      { category: "Diamond", completion: 0, color: "bg-blue-500" },
      { category: "Gold", completion: 0, color: "bg-amber-500" },
      { category: "Silver", completion: 0, color: "bg-slate-400" },
      { category: "Bronze", completion: 0, color: "bg-orange-700" }
    ];
  }
};

export const getVisitMetrics = async (userId: string) => {
  try {
    // Get recent visits
    const { data: visits, error: visitsError } = await supabase
      .from("branch_visits")
      .select("*")
      .eq("user_id", userId)
      .order("visit_date", { ascending: false })
      .limit(10);
    
    if (visitsError) throw visitsError;
    
    if (!visits || visits.length === 0) {
      return {
        hrConnectSessions: { completed: 0, total: 0 },
        avgParticipation: 0,
        employeeCoverage: 0,
        newEmployeeCoverage: 0,
      };
    }
    
    // Calculate HR Connect metrics
    const hrSessions = visits.filter(visit => visit.hr_connect_session === true).length;
    
    // Calculate average participation
    let totalParticipationRate = 0;
    let participationCount = 0;
    
    visits.forEach(visit => {
      if (visit.total_employees_invited && visit.total_participants && visit.total_employees_invited > 0) {
        totalParticipationRate += (visit.total_participants / visit.total_employees_invited) * 100;
        participationCount++;
      }
    });
    
    const avgParticipation = participationCount > 0 
      ? Math.round(totalParticipationRate / participationCount) 
      : 0;
    
    // Calculate employee coverage metrics
    let totalEmployeeCoverage = 0;
    let employeeCoverageCount = 0;
    
    let totalNewEmployeeCoverage = 0;
    let newEmployeeCoverageCount = 0;
    
    visits.forEach(visit => {
      // Total employee coverage
      const totalEmployees = (visit.total_employees_invited || 0);
      const coveredEmployees = (visit.total_participants || 0);
      
      if (totalEmployees > 0) {
        totalEmployeeCoverage += (coveredEmployees / totalEmployees) * 100;
        employeeCoverageCount++;
      }
      
      // New employee coverage
      const newTotal = (visit.new_employees_total || 0);
      const newCovered = (visit.new_employees_covered || 0);
      
      if (newTotal > 0) {
        totalNewEmployeeCoverage += (newCovered / newTotal) * 100;
        newEmployeeCoverageCount++;
      }
    });
    
    const employeeCoverage = employeeCoverageCount > 0 
      ? Math.round(totalEmployeeCoverage / employeeCoverageCount) 
      : 0;
    
    const newEmployeeCoverage = newEmployeeCoverageCount > 0 
      ? Math.round(totalNewEmployeeCoverage / newEmployeeCoverageCount) 
      : 0;
    
    return {
      hrConnectSessions: { completed: hrSessions, total: visits.length },
      avgParticipation,
      employeeCoverage,
      newEmployeeCoverage,
    };
  } catch (error: any) {
    console.error("Error getting visit metrics:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: `Failed to load visit metrics: ${error.message}`,
    });
    
    return {
      hrConnectSessions: { completed: 0, total: 0 },
      avgParticipation: 0,
      employeeCoverage: 0,
      newEmployeeCoverage: 0,
    };
  }
};
