import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Branch = Database['public']['Tables']['branches']['Row'];
type BranchWithAssignments = Branch & { bh_count: number; bh_assignments?: Array<{ user_id: string, bh_name: string }> };
type BHRUser = Database['public']['Tables']['profiles']['Row'] & { branches_assigned: number };

export async function fetchZoneBranches(userId: string): Promise<BranchWithAssignments[]> {
  try {
    // Get all branches without location filter - fixed the query to properly handle relationships
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('*');

    if (branchError) throw branchError;

    // Get branch assignments separately - this resolves the relationship error
    const { data: branchAssignments, error: assignmentsError } = await supabase
      .from('branch_assignments')
      .select('branch_id, user_id');

    if (assignmentsError) throw assignmentsError;

    // Get all branch assignments with BH names
    const { data: allAssignments, error: profilesError } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        user_id,
        profiles:profiles!user_id(full_name)
      `);
      
    if (profilesError) throw profilesError;

    // Group assignments by branch id
    const assignmentsByBranch: Record<string, Array<{user_id: string, bh_name: string}>> = {};

    allAssignments?.forEach(assignment => {
      const branchId = assignment.branch_id;
      const userId = assignment.user_id;
      let bhName = 'Unknown';
      
      // Extract BH name
      if (assignment.profiles && typeof assignment.profiles === 'object') {
        const profile = assignment.profiles as { full_name?: string };
        bhName = profile.full_name || 'Unknown';
      }

      if (!assignmentsByBranch[branchId]) {
        assignmentsByBranch[branchId] = [];
      }

      assignmentsByBranch[branchId].push({
        user_id: userId,
        bh_name: bhName
      });
    });
    
    // Count assignments per branch from the branchAssignments data
    const assignmentCountByBranch: Record<string, Set<string>> = {};
    
    branchAssignments?.forEach(assignment => {
      if (!assignmentCountByBranch[assignment.branch_id]) {
        assignmentCountByBranch[assignment.branch_id] = new Set();
      }
      assignmentCountByBranch[assignment.branch_id].add(assignment.user_id);
    });
    
    // Process the data to count BHs per branch and add assignments data
    const processedBranches = branches.map(branch => {
      // Count unique BHs for this branch using our separate assignments data
      const uniqueBhsSet = assignmentCountByBranch[branch.id] || new Set();
      
      return {
        ...branch,
        bh_count: uniqueBhsSet.size,
        bh_assignments: assignmentsByBranch[branch.id] || []
      };
    });

    return processedBranches as BranchWithAssignments[];
  } catch (error) {
    console.error("Error fetching zone branches:", error);
    throw error;
  }
}

export async function fetchZoneBHRs(userId: string): Promise<BHRUser[]> {
    try {
      // Get all BH users without location filter
      const { data: bhUsers, error: bhError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'BH');
  
      if (bhError) throw bhError;
      
      // Get branch assignments for these users in a separate query
      const bhUserIds = bhUsers.map(user => user.id);
      
      // Only proceed if we have users
      if (bhUserIds.length === 0) {
        return [] as BHRUser[];
      }
      
      const { data: assignments, error: assignmentsError } = await supabase
        .from('branch_assignments')
        .select('user_id, branch_id')
        .in('user_id', bhUserIds);
        
      if (assignmentsError) throw assignmentsError;
      
      // Group assignments by user
      const assignmentsByUser: Record<string, string[]> = {};
      assignments?.forEach(assignment => {
        if (!assignmentsByUser[assignment.user_id]) {
          assignmentsByUser[assignment.user_id] = [];
        }
        assignmentsByUser[assignment.user_id].push(assignment.branch_id);
      });
      
      // Process the data to count branches per BH
      const processedBHRs = bhUsers.map(user => {
        const branchIds = assignmentsByUser[user.id] || [];
        return {
          ...user,
          branches_assigned: branchIds.length
        };
      });
  
      return processedBHRs as BHRUser[];
    } catch (error) {
      console.error("Error fetching zone BHRs:", error);
      throw error;
    }
  }

export async function fetchDashboardStats(userId: string) {
  try {
    // Count total branches without location filter
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('id', { count: 'exact', head: true });

    if (branchError) throw branchError;

    // Count total BHRs without location filter
    const { count: totalBHRs, error: bhrError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'BH');

    if (bhrError) throw bhrError;

    // Get visits stats
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        branches (location)
      `);

    if (visitsError) throw visitsError;

    // Calculate visit stats
    const visitStats = {
      totalVisits: visits?.length || 0,
      pendingApproval: visits?.filter(v => v.status === 'submitted').length || 0,
      completedVisits: visits?.filter(v => v.status === 'approved').length || 0,
    };

    // Get current month stats
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthVisits = visits?.filter(v => {
      const visitDate = new Date(v.visit_date);
      return visitDate.getMonth() === currentMonth && 
             visitDate.getFullYear() === currentYear;
    });

    const monthlyStats = {
      totalVisits: currentMonthVisits?.length || 0,
      pendingApproval: currentMonthVisits?.filter(v => v.status === 'submitted').length || 0,
      completedVisits: currentMonthVisits?.filter(v => v.status === 'approved').length || 0,
    };

    return {
      totalBranches: totalBranches || 0,
      totalBHRs: totalBHRs || 0,
      visitStats,
      monthlyStats,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
}

export async function assignBranchToBHR(bhUserId: string, branchId: string) {
  try {
    const { data, error } = await supabase
      .from('branch_assignments')
      .insert({
        user_id: bhUserId,
        branch_id: branchId
      });
    
    if (error) throw error;
    
    toast({
      title: "Branch assigned successfully",
      description: "The branch has been assigned to the BHR."
    });
    
    return data;
  } catch (error: any) {
    console.error("Error assigning branch to BHR:", error);
    
    // Check if error is a unique constraint violation (already assigned)
    if (error.code === '23505') {
      toast({
        variant: "destructive",
        title: "Assignment already exists",
        description: "This branch is already assigned to this BHR."
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed to assign branch",
        description: error.message || "An unexpected error occurred."
      });
    }
    
    throw error;
  }
}

export async function unassignBranchFromBHR(bhUserId: string, branchId: string) {
  try {
    const { error } = await supabase
      .from('branch_assignments')
      .delete()
      .eq('user_id', bhUserId)
      .eq('branch_id', branchId);
    
    if (error) throw error;
    
    toast({
      title: "Assignment removed",
      description: "The branch assignment has been removed."
    });
    
    return true;
  } catch (error: any) {
    console.error("Error removing branch assignment:", error);
    toast({
      variant: "destructive",
      title: "Failed to remove assignment",
      description: error.message || "An unexpected error occurred."
    });
    throw error;
  }
}

export async function fetchZoneBHRPerformance() {
  try {
    const { data, error } = await supabase
      .rpc('get_zone_bhr_performance');
      
    if (error) throw error;
    
    // Fix the typing issue - make sure we're returning an array of objects
    const performanceData = Array.isArray(data) ? data.map(item => ({
      name: item.name,
      branches: item.branches,
      coverage: item.coverage
    })) : [];
    
    return performanceData;
  } catch (error) {
    console.error("Error fetching zone BHR performance:", error);
    return [];
  }
}
