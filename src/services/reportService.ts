
import { supabase } from "@/integrations/supabase/client";

export interface BranchVisitReport {
  id: string;
  user_id: string;
  branch_id: string;
  visit_date: string;
  status: string;
  feedback?: string;
  hr_connect_session?: boolean;
  manning_percentage?: number;
  attrition_percentage?: number;
  branch_name?: string;
  branch_location?: string;
  branch_category?: string;
  bh_name?: string;
  bh_code?: string;
}

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

// Add the missing functions needed by ZHReviewReports
export const fetchRecentReports = async (limit = 5): Promise<BranchVisitReport[]> => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        user_id,
        branch_id,
        hr_connect_session,
        manning_percentage,
        attrition_percentage,
        feedback,
        profiles:user_id (full_name, e_code),
        branches:branch_id (name, location, category)
      `)
      .order('visit_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    
    // Transform data to match BranchVisitReport interface
    return (data || []).map(report => {
      // Correctly handle nested objects from Supabase join
      // Use proper type assertions for the nested objects
      const branches = report.branches as any; // Using any temporarily for type safety
      const profiles = report.profiles as any; // Using any temporarily for type safety
      
      return {
        id: report.id,
        user_id: report.user_id,
        branch_id: report.branch_id,
        visit_date: report.visit_date,
        status: report.status,
        feedback: report.feedback,
        hr_connect_session: report.hr_connect_session,
        manning_percentage: report.manning_percentage,
        attrition_percentage: report.attrition_percentage,
        branch_name: branches?.name,
        branch_location: branches?.location,
        branch_category: branches?.category,
        bh_name: profiles?.full_name,
        bh_code: profiles?.e_code
      };
    });
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
};

export const fetchReportById = async (reportId: string): Promise<BranchVisitReport | null> => {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        visit_date,
        status,
        user_id,
        branch_id,
        hr_connect_session,
        manning_percentage,
        attrition_percentage,
        feedback,
        profiles:user_id (full_name, e_code),
        branches:branch_id (name, location, category)
      `)
      .eq('id', reportId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Correctly handle nested objects from Supabase join
    // Use proper type assertions for the nested objects
    const branches = data.branches as any; // Using any temporarily for type safety
    const profiles = data.profiles as any; // Using any temporarily for type safety
    
    return {
      id: data.id,
      user_id: data.user_id,
      branch_id: data.branch_id,
      visit_date: data.visit_date,
      status: data.status,
      feedback: data.feedback,
      hr_connect_session: data.hr_connect_session,
      manning_percentage: data.manning_percentage,
      attrition_percentage: data.attrition_percentage,
      branch_name: branches?.name,
      branch_location: branches?.location,
      branch_category: branches?.category,
      bh_name: profiles?.full_name,
      bh_code: profiles?.e_code
    };
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    return null;
  }
};

export const updateReportStatus = async (reportId: string, status: "approved" | "rejected"): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('branch_visits')
      .update({ status })
      .eq('id', reportId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating report status:", error);
    return false;
  }
};
