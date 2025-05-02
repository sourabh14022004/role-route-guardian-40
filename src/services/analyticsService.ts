
import { supabase } from "@/integrations/supabase/client";

export const fetchDashboardStats = async () => {
  console.info("Fetching dashboard stats...");
  
  try {
    // Get total branches
    const { data: branches, error: branchError } = await supabase
      .from('branches')
      .select('id');
    
    if (branchError) throw branchError;
    const totalBranches = branches?.length || 0;
    console.info(`Total branches: ${totalBranches}`);
    
    // Get unique BHRs who submitted reports
    const { data: bhrs, error: bhrsError } = await supabase
      .from('branch_visits')
      .select('user_id', { count: 'exact', head: true })
      .eq('status', 'approved');
    
    if (bhrsError) throw bhrsError;
    
    // Get visited branches (unique branch_id in approved visits for current month)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('*');
    
    if (visitsError) throw visitsError;
    
    console.info("All visits:", visits);
    
    // Calculate visited branches count (unique branches)
    const uniqueBranchIds = new Set(visits.map(visit => visit.branch_id));
    const visitedBranchesCount = uniqueBranchIds.size;
    console.info("Visited branches count:", visitedBranchesCount);
    
    // Calculate unique BHR IDs
    const uniqueBhrIds = new Set(visits.filter(visit => visit.status === 'approved').map(visit => visit.user_id)).size;
    
    // Calculate metrics
    const currentCoverage = totalBranches > 0 ? Math.round((visitedBranchesCount / totalBranches) * 100) : 0;
    
    // Calculate averages of manning_percentage, attrition_percentage, and er_percentage
    let manningSum = 0;
    let attritionSum = 0;
    let erSum = 0;
    let count = 0;
    
    visits.forEach(visit => {
      if (visit.manning_percentage !== null) {
        manningSum += visit.manning_percentage;
        count++;
      }
      if (visit.attrition_percentage !== null) attritionSum += visit.attrition_percentage;
      if (visit.er_percentage !== null) erSum += visit.er_percentage;
    });
    
    const currentManningAvg = count > 0 ? Math.round(manningSum / count) : 0;
    const currentAttritionAvg = count > 0 ? Math.round(attritionSum / count) : 0;
    const currentErAvg = count > 0 ? Math.round(erSum / count) : 0;
    
    console.info("Stats calculation complete");
    
    const stats = {
      totalBranches,
      visitedBranchesCount,
      currentCoverage,
      uniqueBhrIds,
      currentManningAvg,
      currentAttritionAvg,
      currentErAvg
    };
    
    console.info(stats);
    
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export const fetchMonthlyTrends = async () => {
  console.info("Fetching monthly trends...");
  
  try {
    // Get all visits with their dates
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, visit_date, total_employees_invited, total_participants');
    
    if (visitsError) throw visitsError;
    console.info("Found", visits.length, "visits for monthly trends");
    
    // Get total branch count for percentage calculation
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id');
    
    if (branchesError) throw branchesError;
    const totalBranches = branches?.length || 0;
    console.info("Total branches for monthly trends:", totalBranches);
    
    // Get the last 6 months including current month
    const currentDate = new Date();
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push({
        month: monthDate.toLocaleDateString('en-US', { month: 'long' }),
        year: monthDate.getFullYear(),
        monthIndex: monthDate.getMonth()
      });
    }
    
    // Process data by month
    const monthlyData = months.map(({ month, year, monthIndex }) => {
      // Filter visits for this month
      const monthVisits = visits.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        return visitDate.getFullYear() === year && visitDate.getMonth() === monthIndex;
      });
      
      // Get unique branches visited this month
      const branchesVisitedThisMonth = new Set(monthVisits.map(visit => visit.branch_id));
      const branchCoverage = totalBranches > 0 ? 
        Math.round((branchesVisitedThisMonth.size / totalBranches) * 100) : 0;
      
      // Calculate employee participation rate
      let totalEmployeesInvited = 0;
      let totalParticipants = 0;
      
      monthVisits.forEach(visit => {
        if (visit.total_employees_invited) totalEmployeesInvited += visit.total_employees_invited;
        if (visit.total_participants) totalParticipants += visit.total_participants;
      });
      
      const participationRate = totalEmployeesInvited > 0 ? 
        Math.round((totalParticipants / totalEmployeesInvited) * 100) : 0;
      
      return {
        month,
        branchCoverage,
        participationRate
      };
    });
    
    // Log the visits by month for debugging
    const visitsByMonth = new Set(visits.map(visit => {
      const visitDate = new Date(visit.visit_date);
      return `${visitDate.getFullYear()}-${visitDate.getMonth() + 1}`;
    }));
    console.info("Visits by month:", Array.from(visitsByMonth));
    
    console.info("Monthly data processed:", monthlyData);
    return monthlyData;
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    throw error;
  }
};

export const fetchZoneMetrics = async () => {
  // Placeholder for zone-specific metrics
  return [
    { zone: "North", coverage: 78, participation: 65, manning: 85, attrition: 12 },
    { zone: "South", coverage: 82, participation: 70, manning: 88, attrition: 8 },
    { zone: "East", coverage: 65, participation: 58, manning: 75, attrition: 15 },
    { zone: "West", coverage: 72, participation: 62, manning: 80, attrition: 10 },
    { zone: "Central", coverage: 85, participation: 75, manning: 90, attrition: 5 },
  ];
};

export const fetchTopPerformers = async () => {
  console.info("Fetching top performers...");
  
  try {
    // Get all BHRs
    const { data: bhrs, error: bhrsError } = await supabase
      .from('profiles')
      .select('id, full_name, e_code')
      .eq('role', 'BH');
    
    if (bhrsError) throw bhrsError;
    console.info("Found", bhrs.length, "BHRs");
    
    // Get branch assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('branch_assignments')
      .select('user_id, branch_id');
    
    if (assignmentsError) throw assignmentsError;
    console.info("Found", assignments.length, "branch assignments");
    
    // Get branch visits
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('user_id, branch_id, status');
    
    if (visitsError) throw visitsError;
    console.info("Found", visits.length, "visits for top performers");
    
    // Calculate performance metrics for each BHR
    const performanceData = bhrs.map(bhr => {
      // Count the number of reports submitted
      const reportsCount = visits.filter(visit => visit.user_id === bhr.id).length;
      
      // Calculate branch coverage
      const assignedBranches = assignments.filter(assignment => assignment.user_id === bhr.id);
      const assignedBranchIds = new Set(assignedBranches.map(a => a.branch_id));
      
      const visitedBranches = new Set(
        visits
          .filter(visit => visit.user_id === bhr.id)
          .map(visit => visit.branch_id)
      );
      
      const coverage = assignedBranchIds.size > 0 ? 
        Math.round((visitedBranches.size / assignedBranchIds.size) * 100) : 0;
      
      return {
        id: bhr.id,
        name: bhr.full_name,
        e_code: bhr.e_code,
        reports: reportsCount,
        coverage: coverage
      };
    });
    
    console.info("Top performers calculated:", performanceData);
    return performanceData;
  } catch (error) {
    console.error("Error fetching top performers:", error);
    throw error;
  }
};
