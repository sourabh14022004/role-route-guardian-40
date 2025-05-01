
import { supabase } from "@/integrations/supabase/client";

export const fetchBHRReportStats = async (bhId: string) => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select('status')
      .eq('user_id', bhId);
    
    if (error) throw error;
    
    // Calculate stats
    const total = data.length;
    const approved = data.filter(item => item.status === 'approved').length;
    const rejected = data.filter(item => item.status === 'rejected').length;
    const pending = data.filter(item => item.status === 'submitted').length;
    
    return { total, approved, rejected, pending };
  } catch (error) {
    console.error("Error fetching BHR report stats:", error);
    return { total: 0, approved: 0, rejected: 0, pending: 0 };
  }
};

export const getActiveBHRsCount = async (): Promise<number> => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    // First, get all users with role BH
    const { data: bhUsers, error: bhError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'BH');
      
    if (bhError) throw bhError;
    
    if (!bhUsers || bhUsers.length === 0) return 0;
    
    // Then count those who have submitted at least one report in current month
    const { data, error } = await supabase
      .from('branch_visits')
      .select('user_id')
      .gte('visit_date', firstDayOfMonth)
      .lte('visit_date', lastDayOfMonth)
      .in('status', ['submitted', 'approved'])
      .in('user_id', bhUsers.map(user => user.id));
    
    if (error) throw error;
    
    // Count unique user_ids
    const uniqueBhIds = new Set(data.map(item => item.user_id));
    return uniqueBhIds.size;
  } catch (error) {
    console.error("Error fetching active BHR count:", error);
    return 0;
  }
};

export const getTotalBranchVisitsInMonth = async (): Promise<number> => {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();
    
    const { count, error } = await supabase
      .from('branch_visits')
      .select('*', { count: 'exact', head: true })
      .gte('visit_date', firstDayOfMonth)
      .lte('visit_date', lastDayOfMonth);
    
    if (error) throw error;
    
    return count || 0;
  } catch (error) {
    console.error("Error fetching monthly branch visits count:", error);
    return 0;
  }
};
