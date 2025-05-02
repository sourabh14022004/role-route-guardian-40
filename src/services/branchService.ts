
import { supabase } from "@/integrations/supabase/client";

// Get branch visit stats for a user
export const getBranchVisitStats = async (userId: string) => {
  try {
    // Get count of assigned branches
    const { data: assignedBranches, error: assignedError } = await supabase
      .from('branch_assignments')
      .select('branch_id', { count: 'exact' })
      .eq('user_id', userId);
      
    if (assignedError) throw assignedError;
    
    // Get count of visited branches
    const { data: visitedBranches, error: visitedError } = await supabase
      .from('branch_visits')
      .select('branch_id')
      .eq('user_id', userId)
      .is('status', 'submitted');
      
    if (visitedError) throw visitedError;
    
    // Count unique branch IDs from visits
    const uniqueVisitedBranches = new Set(visitedBranches?.map(visit => visit.branch_id));
    
    // Get count of pending visits
    const { count: pendingVisits, error: pendingError } = await supabase
      .from('branch_visits')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('status', 'draft');
      
    if (pendingError) throw pendingError;
    
    // Calculate completion rate
    const assignedCount = assignedBranches?.length || 0;
    const visitedCount = uniqueVisitedBranches.size;
    const completionRate = assignedCount > 0 ? Math.round((visitedCount / assignedCount) * 100) : 0;
    
    return {
      assignedBranches: assignedCount,
      branchesVisited: visitedCount,
      pendingVisits: pendingVisits || 0,
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

// Get branch category coverage statistics
export const getBranchCategoryCoverage = async (userId: string) => {
  try {
    // Get all assigned branches with their categories
    const { data: assignedBranches, error: assignedError } = await supabase
      .from('branch_assignments')
      .select(`
        branch_id,
        branches:branch_id (
          id, 
          category
        )
      `)
      .eq('user_id', userId);
      
    if (assignedError) throw assignedError;
    
    // Get all branch visits by the user
    const { data: branchVisits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, status')
      .eq('user_id', userId);
      
    if (visitsError) throw visitsError;
    
    // Count branches by category and visited status
    const categories = ['platinum', 'diamond', 'gold', 'silver', 'bronze'];
    const result = categories.map(category => {
      // Filter assigned branches by category
      const assignedInCategory = assignedBranches
        ?.filter(b => b.branches && b.branches.category === category)
        .length || 0;
      
      // Count unique visited branches in this category
      const visitedBranchIds = branchVisits
        ?.filter(v => v.status !== 'draft')
        .map(v => v.branch_id) || [];
      
      const visitedInCategory = assignedBranches
        ?.filter(b => 
          b.branches && 
          b.branches.category === category && 
          visitedBranchIds.includes(b.branch_id)
        )
        .length || 0;
      
      // Calculate completion percentage
      const completion = assignedInCategory > 0 
        ? Math.round((visitedInCategory / assignedInCategory) * 100) 
        : 0;
      
      return {
        category,
        assigned: assignedInCategory,
        visited: visitedInCategory,
        completion,
        color: getCategoryColor(category)
      };
    });
    
    return result;
  } catch (error) {
    console.error("Error getting branch category coverage:", error);
    return [];
  }
};

// Get category color
const getCategoryColor = (category: string): string => {
  switch(category.toLowerCase()) {
    case 'platinum': return '#9B87F5'; // Purple
    case 'diamond': return '#60A5FA'; // Blue
    case 'gold': return '#FBBF24'; // Gold/Yellow
    case 'silver': return '#9CA3AF'; // Silver/Gray
    case 'bronze': return '#D97706'; // Bronze/Orange
    default: return '#D1D5DB'; // Default gray
  }
};

// Get visit metrics across branches
export const getVisitMetrics = async (dateRange?: { from: Date; to: Date }) => {
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
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Process data by categories
    const categories = ['platinum', 'diamond', 'gold', 'silver', 'bronze'];
    const metrics = categories.map(category => {
      const categoryData = data?.filter(item => 
        item.branch_category.toLowerCase() === category
      ) || [];
      
      // Calculate averages
      const avgManning = categoryData.length > 0 
        ? Math.round(categoryData.reduce((sum, item) => sum + (item.manning_percentage || 0), 0) / categoryData.length) 
        : 0;
        
      const avgAttrition = categoryData.length > 0 
        ? Math.round(categoryData.reduce((sum, item) => sum + (item.attrition_percentage || 0), 0) / categoryData.length) 
        : 0;
        
      const avgER = categoryData.length > 0 
        ? Math.round(categoryData.reduce((sum, item) => sum + (item.er_percentage || 0), 0) / categoryData.length) 
        : 0;
        
      const totalCWT = categoryData.reduce((sum, item) => sum + (item.cwt_cases || 0), 0);
      
      return {
        name: capitalizeFirstLetter(category),
        manning: avgManning,
        attrition: avgAttrition,
        er: avgER,
        cwt: totalCWT
      };
    });
    
    console.info("Category metrics:", metrics);
    return metrics;
  } catch (error) {
    console.error("Error getting visit metrics:", error);
    return [];
  }
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string: string): string => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};
