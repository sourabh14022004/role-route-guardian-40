
import React, { useState } from 'react';
import { fetchRecentReports, fetchReportById, updateReportStatus } from '@/services/reportService';

const ZHReviewReports = () => {
  const [reports, setReports] = useState([]);
  
  // Fix: Update the function calls to match the correct parameters
  const handleFetchReports = async () => {
    try {
      const recentReports = await fetchRecentReports();
      setReports(recentReports);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };
  
  const handleFetchReport = async (id: string) => {
    try {
      const report = await fetchReportById(id);
      console.log("Fetched report:", report);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  };
  
  const handleUpdateStatus = async () => {
    try {
      const result = await updateReportStatus();
      console.log("Updated status:", result);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };
  
  return (
    <div>
      <h1>ZH Review Reports</h1>
      <button onClick={handleFetchReports}>Fetch Reports</button>
    </div>
  );
};

export default ZHReviewReports;
