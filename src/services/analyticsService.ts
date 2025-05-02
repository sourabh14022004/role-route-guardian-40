import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

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
      .in('status', ['submitted', 'approved']);
    
    if (bhrsError) throw bhrsError;
    
    // Get visited branches (unique branch_id in approved visits for current month)
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_id,
        user_id,
        status,
        manning_percentage,
        attrition_percentage,
        er_percentage,
        non_vendor_percentage,
        cwt_cases
      `)
      .in('status', ['submitted', 'approved']);
    
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
    let nonVendorSum = 0;
    let cwTotalCases = 0;
    let count = 0;
    
    visits.forEach(visit => {
      // Manning percentage
      if (visit.manning_percentage !== null) {
        manningSum += visit.manning_percentage;
        count++;
      }
      
      // Attrition percentage
      if (visit.attrition_percentage !== null) {
        attritionSum += visit.attrition_percentage;
      }
      
      // ER percentage
      if (visit.er_percentage !== null) {
        erSum += visit.er_percentage;
      }
      
      // Non-vendor percentage
      if (visit.non_vendor_percentage !== null) {
        nonVendorSum += visit.non_vendor_percentage;
      }
      
      // CWT cases
      if (visit.cwt_cases !== null) {
        cwTotalCases += visit.cwt_cases;
      }
    });
    
    const currentManningAvg = count > 0 ? Math.round(manningSum / count) : 0;
    const currentAttritionAvg = count > 0 ? Math.round(attritionSum / count) : 0;
    const currentErAvg = count > 0 ? Math.round(erSum / count) : 0;
    const nonVendorAvg = count > 0 ? Math.round(nonVendorSum / count) : 0;
    
    console.info("Stats calculation complete");
    
    const stats = {
      totalBranches,
      visitedBranchesCount,
      currentCoverage,
      uniqueBhrIds,
      currentManningAvg,
      currentAttritionAvg,
      currentErAvg,
      nonVendorAvg,
      cwTotalCases
    };
    
    console.info(stats);
    
    return stats;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    toast({
      title: "Error fetching dashboard statistics",
      description: "Could not load dashboard data. Please try again.",
      variant: "destructive"
    });
    // Return some default values if the fetch fails
    return {
      totalBranches: 0,
      visitedBranchesCount: 0,
      currentCoverage: 0,
      uniqueBhrIds: 0,
      currentManningAvg: 0,
      currentAttritionAvg: 0,
      currentErAvg: 0,
      nonVendorAvg: 0,
      cwTotalCases: 0
    };
  }
};

export const fetchMonthlyTrends = async (timeRange = 'lastSixMonths') => {
  console.info("Fetching monthly trends...");
  
  try {
    // Determine the date range based on the timeRange parameter
    let startDate;
    const endDate = new Date();
    
    switch(timeRange) {
      case 'lastSevenDays':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'lastMonth':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'lastThreeMonths':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'lastSixMonths':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case 'lastYear':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'lastThreeYears':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 3);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
    }
    
    // Get all visits with their dates
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select('branch_id, visit_date, total_employees_invited, total_participants, manning_percentage, attrition_percentage, er_percentage, non_vendor_percentage')
      .gte('visit_date', startDate.toISOString())
      .lte('visit_date', endDate.toISOString());
    
    if (visitsError) throw visitsError;
    console.info("Found", visits.length, "visits for monthly trends");
    
    // Get total branch count for percentage calculation
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id');
    
    if (branchesError) throw branchesError;
    const totalBranches = branches?.length || 0;
    console.info("Total branches for monthly trends:", totalBranches);
    
    // Get the appropriate time periods based on timeRange
    const timePeriods = getTimePeriods(timeRange, startDate, endDate);
    
    // Process data by time period
    const trendsData = timePeriods.map(period => {
      // Filter visits for this time period
      const periodVisits = visits.filter(visit => {
        const visitDate = new Date(visit.visit_date);
        return visitDate >= period.start && visitDate <= period.end;
      });
      
      // Get unique branches visited this period
      const branchesVisitedThisPeriod = new Set(periodVisits.map(visit => visit.branch_id));
      const branchCoverage = totalBranches > 0 ? 
        Math.round((branchesVisitedThisPeriod.size / totalBranches) * 100) : 0;
      
      // Calculate employee participation rate
      let totalEmployeesInvited = 0;
      let totalParticipants = 0;
      
      // Calculate metric averages
      let manningSum = 0;
      let attritionSum = 0;
      let erSum = 0;
      let nonVendorSum = 0;
      let count = periodVisits.length || 1;
      
      periodVisits.forEach(visit => {
        // Participation metrics
        if (visit.total_employees_invited) totalEmployeesInvited += visit.total_employees_invited;
        if (visit.total_participants) totalParticipants += visit.total_participants;
        
        // HR metrics
        if (visit.manning_percentage) manningSum += visit.manning_percentage;
        if (visit.attrition_percentage) attritionSum += visit.attrition_percentage;
        if (visit.er_percentage) erSum += visit.er_percentage;
        if (visit.non_vendor_percentage) nonVendorSum += visit.non_vendor_percentage;
      });
      
      const participationRate = totalEmployeesInvited > 0 ? 
        Math.round((totalParticipants / totalEmployeesInvited) * 100) : 0;
      
      return {
        month: period.label,
        branchCoverage,
        participationRate,
        manningPercentage: Math.round(manningSum / count),
        attritionRate: Math.round(attritionSum / count),
        erPercentage: Math.round(erSum / count),
        nonVendorPercentage: Math.round(nonVendorSum / count)
      };
    });
    
    console.info("Monthly data processed:", trendsData);
    return trendsData;
  } catch (error) {
    console.error("Error fetching monthly trends:", error);
    toast({
      title: "Error fetching trend data",
      description: "Could not load trend data. Please try again.",
      variant: "destructive"
    });
    
    // Return empty data as fallback
    return [];
  }
};

function getTimePeriods(timeRange, startDate, endDate) {
  const periods = [];
  let currentDate;
  
  switch(timeRange) {
    case 'lastSevenDays':
      // Create daily periods
      for (let i = 6; i >= 0; i--) {
        currentDate = new Date(endDate);
        currentDate.setDate(currentDate.getDate() - i);
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        periods.push({
          start: dayStart,
          end: dayEnd,
          label: currentDate.toLocaleDateString('en-US', { weekday: 'short' })
        });
      }
      break;
      
    case 'lastMonth':
      // Split into weeks
      currentDate = new Date(startDate);
      while (currentDate < endDate) {
        const weekStart = new Date(currentDate);
        const weekEnd = new Date(currentDate);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > endDate) weekEnd.setTime(endDate.getTime());
        
        periods.push({
          start: weekStart,
          end: weekEnd,
          label: `Week ${periods.length + 1}`
        });
        
        currentDate.setDate(currentDate.getDate() + 7);
      }
      break;
      
    case 'lastThreeMonths':
    case 'lastSixMonths':
    case 'lastYear':
      // Monthly periods
      currentDate = new Date(startDate);
      currentDate.setDate(1);
      
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0); // Last day of current month
        
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString('en-US', { month: 'short' })
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      break;
      
    case 'lastThreeYears':
      // Quarterly periods
      currentDate = new Date(startDate);
      const quarterMonth = Math.floor(currentDate.getMonth() / 3) * 3;
      currentDate.setMonth(quarterMonth, 1);
      
      while (currentDate < endDate) {
        const quarterStart = new Date(currentDate);
        const quarterEnd = new Date(currentDate);
        quarterEnd.setMonth(quarterStart.getMonth() + 3, 0);
        
        const year = quarterStart.getFullYear();
        const quarter = Math.floor(quarterStart.getMonth() / 3) + 1;
        
        periods.push({
          start: quarterStart,
          end: quarterEnd,
          label: `Q${quarter} ${year}`
        });
        
        currentDate.setMonth(currentDate.getMonth() + 3);
      }
      break;
      
    default:
      // Default to monthly for last six months
      currentDate = new Date(startDate);
      currentDate.setDate(1);
      
      while (currentDate < endDate) {
        const monthStart = new Date(currentDate);
        const monthEnd = new Date(currentDate);
        monthEnd.setMonth(monthEnd.getMonth() + 1, 0); // Last day of current month
        
        periods.push({
          start: monthStart,
          end: monthEnd,
          label: monthStart.toLocaleDateString('en-US', { month: 'long' })
        });
        
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
  }
  
  return periods;
}

export const fetchZoneMetrics = async () => {
  try {
    // Get zone metrics from database
    const { data, error } = await supabase
      .from('zone_metrics')
      .select('zone, coverage, participation, manning, attrition');
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      return data;
    }
    
    // If no data found, return placeholder data
    return [
      { zone: "North", coverage: 78, participation: 65, manning: 85, attrition: 12 },
      { zone: "South", coverage: 82, participation: 70, manning: 88, attrition: 8 },
      { zone: "East", coverage: 65, participation: 58, manning: 75, attrition: 15 },
      { zone: "West", coverage: 72, participation: 62, manning: 80, attrition: 10 },
      { zone: "Central", coverage: 85, participation: 75, manning: 90, attrition: 5 },
    ];
  } catch (error) {
    console.error("Error fetching zone metrics:", error);
    
    // Return placeholder data on error
    return [
      { zone: "North", coverage: 78, participation: 65, manning: 85, attrition: 12 },
      { zone: "South", coverage: 82, participation: 70, manning: 88, attrition: 8 },
      { zone: "East", coverage: 65, participation: 58, manning: 75, attrition: 15 },
      { zone: "West", coverage: 72, participation: 62, manning: 80, attrition: 10 },
      { zone: "Central", coverage: 85, participation: 75, manning: 90, attrition: 5 },
    ];
  }
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
    toast({
      title: "Error fetching performers data",
      description: "Could not load top performers. Please try again.",
      variant: "destructive"
    });
    return [];
  }
};

export const fetchQualitativeAssessments = async (dateRange = null) => {
  try {
    // Get qualitative assessments from branch visits
    let query = supabase
      .from('branch_visits')
      .select(`
        overall_discipline,
        branch_hygiene,
        culture_branch,
        line_manager_behavior
      `)
      .in('status', ['submitted', 'approved'])
      .not('overall_discipline', 'is', null);
      
    // Apply date filter if provided
    if (dateRange && dateRange.from && dateRange.to) {
      query = query.gte('visit_date', dateRange.from.toISOString())
                   .lte('visit_date', dateRange.to.toISOString());
    }
    
    const { data, error } = await query;
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        discipline: 0,
        hygiene: 0,
        culture: 0,
        behavior: 0,
        overall: 0,
        count: 0
      };
    }
    
    // Convert text ratings to numeric values for calculation
    const ratingValue = {
      'very_poor': 1,
      'poor': 2,
      'neutral': 3,
      'good': 4,
      'excellent': 5
    };

    // Calculate the count of valid records
    const count = data.length;
    
    // Calculate averages based on the rating values
    let disciplineSum = 0;
    let hygieneSum = 0;
    let cultureSum = 0;
    let behaviorSum = 0;
    
    data.forEach(item => {
      if (item.overall_discipline) {
        disciplineSum += ratingValue[item.overall_discipline] || 0;
      }
      
      if (item.branch_hygiene) {
        hygieneSum += ratingValue[item.branch_hygiene] || 0;
      }
      
      if (item.culture_branch) {
        cultureSum += ratingValue[item.culture_branch] || 0;
      }
      
      if (item.line_manager_behavior) {
        behaviorSum += ratingValue[item.line_manager_behavior] || 0;
      }
    });
    
    // Calculate average ratings
    const discipline = count > 0 ? disciplineSum / count : 0;
    const hygiene = count > 0 ? hygieneSum / count : 0;
    const culture = count > 0 ? cultureSum / count : 0;
    const behavior = count > 0 ? behaviorSum / count : 0;
    
    // Overall average of all ratings
    const overall = (discipline + hygiene + culture + behavior) / 4;
    
    return {
      discipline,
      hygiene,
      culture,
      behavior,
      overall,
      count
    };
  } catch (error) {
    console.error("Error fetching qualitative assessments:", error);
    return {
      discipline: 0,
      hygiene: 0,
      culture: 0,
      behavior: 0,
      overall: 0,
      count: 0
    };
  }
};

export const fetchCategoryBreakdown = async () => {
  try {
    console.log("Fetching category breakdown from branch visits...");
    
    // Get all branch visits with branch information
    const { data: visits, error: visitsError } = await supabase
      .from('branch_visits')
      .select(`
        id,
        branch_category
      `)
      .in('status', ['submitted', 'approved']);
    
    if (visitsError) throw visitsError;
    
    if (!visits || visits.length === 0) {
      return [];
    }
    
    // Count branch categories from visit data
    const categoryCounts = {};
    
    visits.forEach(visit => {
      if (!visit.branch_category) return;
      
      const category = visit.branch_category.charAt(0).toUpperCase() + visit.branch_category.slice(1).toLowerCase();
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Format the results
    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      value: count
    }));
  } catch (error) {
    console.error("Error fetching category breakdown:", error);
    toast({
      title: "Error loading category data",
      description: "Could not load branch categories. Please try again.",
      variant: "destructive"
    });
    
    // Return empty array on error
    return [];
  }
};
