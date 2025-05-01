
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Search, MapPin, Mail } from "lucide-react";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const ZHBHRManagement = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBHRId, setSelectedBHRId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Fetch BHRs
  const { data: bhrs, isLoading } = useQuery({
    queryKey: ["bhrs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          branch_assignments:branch_assignments(
            branches:branch_id(name)
          ),
          branch_visits:branch_visits(
            id,
            created_at,
            status
          )
        `)
        .eq("role", "BH");
        
      if (error) throw error;
      return data || [];
    },
  });

  const filterBHRs = () => {
    if (!bhrs) return [];
    
    return bhrs.filter(bhr => {
      const searchLower = searchQuery.toLowerCase();
      return (
        bhr.full_name?.toLowerCase().includes(searchLower) ||
        bhr.e_code?.toLowerCase().includes(searchLower) ||
        bhr.location?.toLowerCase().includes(searchLower)
      );
    });
  };

  const filteredBHRs = filterBHRs();
  
  const handleBHRClick = (bhrId: string) => {
    setSelectedBHRId(bhrId);
    setIsModalOpen(true);
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBHRId(null);
  };

  // Calculate metrics for each BHR
  const getBHRMetrics = (bhr: any) => {
    const branchAssignments = bhr.branch_assignments?.length || 0;
    
    // Count reports by status
    const reports = {
      total: bhr.branch_visits?.length || 0,
      approved: bhr.branch_visits?.filter((visit: any) => visit.status === 'approved').length || 0,
      pending: bhr.branch_visits?.filter((visit: any) => visit.status === 'submitted').length || 0,
      rejected: bhr.branch_visits?.filter((visit: any) => visit.status === 'rejected').length || 0,
    };
    
    return {
      branchCount: branchAssignments,
      reports
    };
  };
  
  // BHR card component
  const BHRCard = ({ bhr }: { bhr: any }) => {
    const metrics = getBHRMetrics(bhr);
    
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleBHRClick(bhr.id)}>
        <CardContent className="p-0">
          <div className="p-5">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 bg-blue-600 text-white text-xl">
                <span>{bhr.full_name?.charAt(0) || 'B'}</span>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{bhr.full_name}</h3>
                <p className="text-slate-500">{bhr.e_code}</p>
                
                <div className="flex items-center mt-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{bhr.location}</span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-sm text-slate-500">Branches Mapped</p>
                <p className="text-2xl font-bold text-blue-700">{metrics.branchCount}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reports Submitted</p>
                <p className="text-2xl font-bold text-blue-700">{metrics.reports.total}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="bg-green-50 p-3 rounded-md text-center">
                <p className="text-green-700 font-medium">Approved</p>
                <p className="text-xl font-bold text-green-700">{metrics.reports.approved}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-md text-center">
                <p className="text-blue-700 font-medium">Pending</p>
                <p className="text-xl font-bold text-blue-700">{metrics.reports.pending}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-md text-center">
                <p className="text-red-700 font-medium">Rejected</p>
                <p className="text-xl font-bold text-red-700">{metrics.reports.rejected}</p>
              </div>
            </div>
            
            <Button variant="outline" className="w-full mt-4">View Details</Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">BHR Management</h1>
          <p className="text-slate-500">Manage and monitor Branch HR representatives</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search BHRs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredBHRs.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">No BHRs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBHRs.map((bhr) => (
            <BHRCard key={bhr.id} bhr={bhr} />
          ))}
        </div>
      )}
      
      <BHRDetailsModal 
        bhId={selectedBHRId}
        open={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default ZHBHRManagement;
