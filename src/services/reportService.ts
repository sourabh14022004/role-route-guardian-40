
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface BranchVisitReport {
  id: string;
  user_id: string;
  branch_id: string;
  visit_date: string;
  bh_name?: string;
  branch_name?: string;
  branch_category: "platinum" | "diamond" | "gold" | "silver" | "bronze";
  hr_connect_session: boolean | null;
  manning_percentage: number | null;
  attrition_percentage: number | null;
  feedback: string | null;
  status: "draft" | "submitted" | "approved" | "rejected" | null;
  created_at: string;
}

export async function fetchRecentReports(limit = 5) {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        user_id,
        branch_id,
        visit_date,
        branch_category,
        hr_connect_session,
        manning_percentage,
        attrition_percentage,
        feedback,
        status,
        created_at,
        branches:branch_id(name),
        profiles:user_id(full_name)
      `)
      .order('visit_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;

    // Transform the data to match our interface
    const transformedData = (data || []).map(visit => {
      return {
        id: visit.id,
        user_id: visit.user_id,
        branch_id: visit.branch_id,
        branch_name: visit.branches ? visit.branches.name : 'Unknown Branch',
        bh_name: visit.profiles ? visit.profiles.full_name : 'Unknown BH',
        visit_date: visit.visit_date,
        branch_category: visit.branch_category,
        hr_connect_session: visit.hr_connect_session,
        manning_percentage: visit.manning_percentage,
        attrition_percentage: visit.attrition_percentage,
        feedback: visit.feedback,
        status: visit.status,
        created_at: visit.created_at
      };
    });
    
    return transformedData;
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function fetchReportById(reportId: string) {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select(`
        *,
        branches:branch_id(name, location, category),
        profiles:user_id(full_name, e_code)
      `)
      .eq('id', reportId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      branch_name: data.branches ? data.branches.name : undefined,
      branch_location: data.branches ? data.branches.location : undefined,
      bh_name: data.profiles ? data.profiles.full_name : undefined,
      bh_code: data.profiles ? data.profiles.e_code : undefined
    };
  } catch (error: any) {
    console.error("Error fetching report:", error);
    return null;
  }
}

export async function updateReportStatus(reportId: string, status: "approved" | "rejected") {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .update({ status })
      .eq('id', reportId)
      .select();
    
    if (error) throw error;
    
    toast({
      title: `Report ${status}`,
      description: `The report has been ${status} successfully.`
    });
    
    return data;
  } catch (error: any) {
    console.error("Error updating report status:", error);
    toast({
      variant: "destructive",
      title: "Failed to update report",
      description: error.message || "An unexpected error occurred."
    });
    return null;
  }
}

export async function fetchBHRReportStats(bhId: string) {
  try {
    const { data, error } = await supabase
      .from('branch_visits')
      .select('id, status')
      .eq('user_id', bhId);
    
    if (error) throw error;
    
    const stats = {
      total: data?.length || 0,
      approved: data?.filter(report => report.status === 'approved').length || 0,
      pending: data?.filter(report => report.status === 'submitted').length || 0,
      rejected: data?.filter(report => report.status === 'rejected').length || 0,
      draft: data?.filter(report => report.status === 'draft').length || 0
    };
    
    return stats;
  } catch (error: any) {
    console.error("Error fetching BHR report stats:", error);
    return {
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      draft: 0
    };
  }
}
