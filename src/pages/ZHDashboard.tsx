
import React, { useState, useEffect } from 'react';
import { getActiveBHRsCount } from '@/services/reportService';

const ZHDashboard = () => {
  const [activeBHRs, setActiveBHRs] = useState<number>(0);
  const [totalBHRs, setTotalBHRs] = useState<number>(0);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await getActiveBHRsCount();
        // Fix: Extract and set values separately
        setActiveBHRs(result.count);
        setTotalBHRs(result.total);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      }
    };
    
    loadData();
  }, []);
  
  return (
    <div>
      <h1>ZH Dashboard</h1>
      <p>Active BHRs: {activeBHRs} / {totalBHRs}</p>
    </div>
  );
};

export default ZHDashboard;
