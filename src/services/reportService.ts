
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth } from "date-fns";

export const fetchBHRReportStats = async (userId: string) => {
  try {
    // Fetch all reports for this BHR
    const { data: reports, error } = await supabase
      .from("branch_visits")
      .select("id, status")
      .eq("user_id", userId);
    
    if (error) throw error;
    
    // Calculate stats
    const total = reports?.length || 0;
    const approved = reports?.filter(report => report.status === "approved").length || 0;
    const rejected = reports?.filter(report => report.status === "rejected").length || 0;
    const pending = reports?.filter(report => report.status === "submitted").length || 0;
    const draft = reports?.filter(report => report.status === "draft").length || 0;
    
    return {
      total,
      approved,
      rejected,
      pending,
      draft
    };
  } catch (error) {
    console.error("Error fetching BHR report stats:", error);
    return {
      total: 0,
      approved: 0, 
      rejected: 0,
      pending: 0,
      draft: 0
    };
  }
};

export const fetchZHDashboardStats = async () => {
  try {
    const currentDate = new Date();
    const monthStart = startOfMonth(currentDate).toISOString();
    const monthEnd = endOfMonth(currentDate).toISOString();
    
    // Get total BHRs
    const { count: totalBHRs, error: bhrError } = await supabase
      .from("profiles")
      .select("*", { count: "exact" })
      .eq("role", "BH");
    
    if (bhrError) throw bhrError;
    
    // Get active BHRs (submitted reports this month)
    const { data: activeReports, error: activeError } = await supabase
      .from("branch_visits")
      .select("user_id")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd);
    
    if (activeError) throw activeError;
    
    const activeBHRs = new Set(activeReports?.map(report => report.user_id)).size;
    
    // Get report statistics
    const { data: reports, error: reportsError } = await supabase
      .from("branch_visits")
      .select("status");
    
    if (reportsError) throw reportsError;
    
    const totalReports = reports?.length || 0;
    const pendingReports = reports?.filter(report => report.status === "submitted").length || 0;
    
    // Get this month's reports
    const { data: monthReports, error: monthError } = await supabase
      .from("branch_visits")
      .select("status")
      .gte("created_at", monthStart)
      .lte("created_at", monthEnd);
      
    if (monthError) throw monthError;
    
    const monthlySubmissions = monthReports?.length || 0;
    
    // Get branch statistics
    const { count: totalBranches, error: branchError } = await supabase
      .from("branches")
      .select("*", { count: "exact" });
    
    if (branchError) throw branchError;
    
    // Get mapped branches
    const { data: mappedBranches, error: mappedError } = await supabase
      .from("branch_assignments")
      .select("branch_id");
      
    if (mappedError) throw mappedError;
    
    const mappedBranchCount = new Set(mappedBranches?.map(branch => branch.branch_id)).size;
    
    return {
      bhrs: {
        total: totalBHRs || 0,
        active: activeBHRs
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        monthly: monthlySubmissions
      },
      branches: {
        total: totalBranches || 0,
        mapped: mappedBranchCount
      }
    };
  } catch (error) {
    console.error("Error fetching ZH dashboard stats:", error);
    return {
      bhrs: {
        total: 0,
        active: 0
      },
      reports: {
        total: 0,
        pending: 0,
        monthly: 0
      },
      branches: {
        total: 0,
        mapped: 0
      }
    };
  }
};
