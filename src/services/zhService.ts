
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

type Branch = Database['public']['Tables']['branches']['Row'];
type BranchWithAssignments = Branch & { bh_count: number };
type BHRUser = Database['public']['Tables']['profiles']['Row'] & { branches_assigned: number };

export async function fetchZoneBranches(userId: string): Promise<BranchWithAssignments[]> {
  try {
    // First, get the ZH profile to identify their location
    const { data: zhProfile, error: zhError } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', userId)
      .single();

    if (zhError) throw zhError;
    if (!zhProfile) throw new Error('Zone Head profile not found');

    // Get all branches in this zone/location
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select(`
        *,
        branch_assignments!inner (
          user_id
        )
      `)
      .eq('location', zhProfile.location);

    if (branchError) throw branchError;

    // Process the data to count BHs per branch
    const processedBranches = branches.map(branch => {
      // Count unique BHs for this branch
      const uniqueBhs = new Set();
      if (branch.branch_assignments) {
        // Handle array of branch_assignments
        if (Array.isArray(branch.branch_assignments)) {
          branch.branch_assignments.forEach((assignment: any) => {
            uniqueBhs.add(assignment.user_id);
          });
        }
      }

      return {
        ...branch,
        bh_count: uniqueBhs.size
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
    // First, get the ZH profile to identify their location
    const { data: zhProfile, error: zhError } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', userId)
      .single();

    if (zhError) throw zhError;
    if (!zhProfile) throw new Error('Zone Head profile not found');

    // Get all BH users in this zone/location
    const { data: bhUsers, error: bhError } = await supabase
      .from('profiles')
      .select(`
        *,
        branch_assignments!inner (
          branch_id
        )
      `)
      .eq('location', zhProfile.location)
      .eq('role', 'BH');

    if (bhError) throw bhError;

    // Process the data to count branches per BH
    const processedBHRs = bhUsers.map(user => {
      // Count unique branches for this BH
      const uniqueBranches = new Set();
      if (user.branch_assignments) {
        // Handle array of branch_assignments
        if (Array.isArray(user.branch_assignments)) {
          user.branch_assignments.forEach((assignment: any) => {
            uniqueBranches.add(assignment.branch_id);
          });
        }
      }

      return {
        ...user,
        branches_assigned: uniqueBranches.size
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
    // First, get the ZH profile to identify their location
    const { data: zhProfile, error: zhError } = await supabase
      .from('profiles')
      .select('location')
      .eq('id', userId)
      .single();

    if (zhError) throw zhError;
    if (!zhProfile) throw new Error('Zone Head profile not found');

    // Count total branches in the zone
    const { count: totalBranches, error: branchError } = await supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('location', zhProfile.location);

    if (branchError) throw branchError;

    // Count total BHRs in the zone
    const { count: totalBHRs, error: bhrError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('location', zhProfile.location)
      .eq('role', 'BH');

    if (bhrError) throw bhrError;

    // Get visits stats
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        branches!inner (location)
      `)
      .eq('branches.location', zhProfile.location);

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
