
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export interface BranchVisitSummary {
  id: string;
  visit_date: string;
  status: string | null;
  branch_name: string;
  branch_location: string;
  branch_category: string;
  bh_name: string;
  bh_code: string;
}

export async function fetchRecentReports(limit: number = 5): Promise<BranchVisitSummary[]> {
  try {
    // First get the visits
    const { data: rawVisits, error } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        visit_date,
        status,
        branches:branch_id (
          name,
          location,
          category
        ),
        profiles:user_id (
          full_name,
          e_code
        )
      `)
      .order('visit_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!rawVisits?.length) return [];

    return rawVisits.map(visit => ({
      id: visit.id,
      visit_date: visit.visit_date,
      status: visit.status,
      branch_name: visit.branches?.name || 'Unknown',
      branch_location: visit.branches?.location || 'Unknown',
      branch_category: visit.branches?.category || 'Unknown',
      bh_name: visit.profiles?.full_name || 'Unknown',
      bh_code: visit.profiles?.e_code || 'Unknown'
    }));
  } catch (error: any) {
    console.error("Error fetching recent reports:", error);
    toast({
      variant: "destructive",
      title: "Error loading reports",
      description: error.message || "Unable to load recent reports"
    });
    return [];
  }
}

export async function fetchReportById(reportId: string) {
  try {
    // Get the visit first
    const { data: visit, error } = await supabase
      .from('branch_visits')
      .select('*')
      .eq('id', reportId)
      .single();

    if (error || !visit) {
      throw error || new Error("Visit not found");
    }

    // Get branch details
    const { data: branch } = await supabase
      .from('branches')
      .select('*')
      .eq('id', visit.branch_id)
      .single();

    // Get BHR details
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, e_code')
      .eq('id', visit.user_id)
      .single();

    return {
      ...visit,
      branch_name: branch?.name || 'Unknown',
      branch_location: branch?.location || 'Unknown',
      branch_category: branch?.category || 'Unknown',
      bh_name: profile?.full_name || 'Unknown',
      bh_code: profile?.e_code || 'Unknown'
    };
  } catch (error: any) {
    console.error("Error fetching report details:", error);
    toast({
      variant: "destructive",
      title: "Error loading report",
      description: error.message || "Unable to load report details"
    });
    return null;
  }
}

export async function updateReportStatus(reportId: string, status: "approved" | "rejected") {
  try {
    const { error } = await supabase
      .from('branch_visits')
      .update({ status })
      .eq('id', reportId);

    if (error) throw error;

    toast({
      title: `Report ${status}`,
      description: `The report has been ${status} successfully.`
    });
    
    return true;
  } catch (error: any) {
    console.error("Error updating report status:", error);
    toast({
      variant: "destructive",
      title: "Error updating report",
      description: error.message || "Unable to update report status"
    });
    return false;
  }
}

// Define the type for qualitative metrics based on the actual database schema
export type QualitativeMetric = 
  'leaders_aligned_with_code' | 
  'employees_feel_safe' | 
  'employees_feel_motivated' | 
  'leaders_abusive_language' |
  'employees_comfort_escalation' |
  'inclusive_culture';

// Define the type for heatmap data
export interface HeatmapData {
  metric: QualitativeMetric;
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
  total: number;
}

export async function getQualitativeMetricsForHeatmap(
  dateRange?: { from: Date; to: Date },
  branchCategory?: string | null
): Promise<HeatmapData[]> {
  try {
    let query = supabase
      .from('branch_visits')
      .select(`
        leaders_aligned_with_code,
        employees_feel_safe,
        employees_feel_motivated,
        leaders_abusive_language,
        employees_comfort_escalation,
        inclusive_culture
      `);
    
    // Apply date range filter if provided
    if (dateRange?.from) {
      query = query.gte('visit_date', dateRange.from.toISOString().split('T')[0]);
      
      if (dateRange.to) {
        query = query.lte('visit_date', dateRange.to.toISOString().split('T')[0]);
      }
    }
    
    // Apply branch category filter if provided
    if (branchCategory) {
      query = query.eq('branch_category', branchCategory);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Initialize metrics object
    const metrics: QualitativeMetric[] = [
      'leaders_aligned_with_code',
      'employees_feel_safe',
      'employees_feel_motivated',
      'leaders_abusive_language',
      'employees_comfort_escalation',
      'inclusive_culture'
    ];
    
    const ratings = ['very_poor', 'poor', 'neutral', 'good', 'excellent'];
    
    // Process the data into the required format
    const result: HeatmapData[] = metrics.map(metric => {
      // Count occurrences of each rating for this metric
      const counts = {
        very_poor: 0,
        poor: 0,
        neutral: 0,
        good: 0,
        excellent: 0,
        total: 0
      };
      
      if (data) {
        data.forEach(item => {
          const value = item[metric as keyof typeof item] as string;
          if (value && ratings.includes(value)) {
            counts[value as keyof typeof counts] += 1;
            counts.total += 1;
          }
        });
      }
      
      return {
        metric,
        ...counts
      };
    });
    
    return result;
  } catch (error: any) {
    console.error("Error fetching qualitative metrics:", error);
    toast({
      variant: "destructive",
      title: "Error loading metrics",
      description: error.message || "Unable to load qualitative metrics"
    });
    return [];
  }
}
