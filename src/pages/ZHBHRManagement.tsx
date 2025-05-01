
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchBHRReportStats } from "@/services/reportService";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";

interface BHRUser {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
  reports_stats?: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
}

const ZHBHRManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");
  const [selectedBHRId, setSelectedBHRId] = useState<string | null>(null);

  const { data: bhrs, isLoading } = useQuery({
    queryKey: ['zh-bhrs-management'],
    queryFn: async () => {
      try {
        // First, get the ZH profile to identify their location
        const { data: zhProfile, error: zhError } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user?.id || '')
          .single();
        
        if (zhError) throw zhError;
        
        // Get all BH users in this zone/location
        const { data: bhUsers, error: bhError } = await supabase
          .from('profiles')
          .select('id, full_name, e_code, location')
          .eq('role', 'BH')
          .eq('location', zhProfile?.location || '');
        
        if (bhError) throw bhError;
        
        // Get branch assignments for these users
        const bhrIds = (bhUsers || []).map(user => user.id);
        
        const { data: assignments, error: assignmentError } = await supabase
          .from('branch_assignments')
          .select('user_id, branch_id')
          .in('user_id', bhrIds);
          
        if (assignmentError) throw assignmentError;
        
        // Group assignments by user
        const assignmentsByUser: Record<string, string[]> = {};
        (assignments || []).forEach(assignment => {
          if (!assignmentsByUser[assignment.user_id]) {
            assignmentsByUser[assignment.user_id] = [];
          }
          assignmentsByUser[assignment.user_id].push(assignment.branch_id);
        });
        
        // Get reports count for each BHR
        const bhrsWithReportStats: BHRUser[] = [];
        
        // Process BHRs one by one with their assigned branches
        for (const bhr of (bhUsers || [])) {
          const branches = assignmentsByUser[bhr.id] || [];
          
          // Get report stats for this BHR
          const reportStats = await fetchBHRReportStats(bhr.id);
          
          bhrsWithReportStats.push({
            ...bhr,
            branches_assigned: branches.length,
            reports_stats: {
              total: reportStats.total,
              approved: reportStats.approved,
              pending: reportStats.pending,
              rejected: reportStats.rejected
            }
          });
        }
        
        return bhrsWithReportStats;
      } catch (error) {
        console.error("Error fetching BHR users:", error);
        return [];
      }
    }
  });

  // Get locations from BHRs for the filter
  const locations = React.useMemo(() => {
    if (!bhrs) return ["All Locations"];
    return ["All Locations", ...new Set(bhrs.map(bhr => bhr.location))];
  }, [bhrs]);

  // Filter BHRs based on search and location
  const filteredBHRs = React.useMemo(() => {
    if (!bhrs) return [];
    
    return bhrs.filter(bhr => {
      const matchesSearch = searchQuery 
        ? bhr.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          bhr.e_code.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
        
      const matchesLocation = locationFilter === "All Locations" || bhr.location === locationFilter;
      
      return matchesSearch && matchesLocation;
    });
  }, [bhrs, searchQuery, locationFilter]);

  const handleBHRClick = (bhrId: string) => {
    setSelectedBHRId(bhrId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">BHR Management</h1>
        <p className="text-slate-600 mt-1">Monitor and manage Branch HR representatives</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Search by name, email, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {locations.map(location => (
              <SelectItem key={location} value={location}>{location}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select defaultValue="All Channels">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Channels">All Channels</SelectItem>
            <SelectItem value="Corporate">Corporate Banking</SelectItem>
            <SelectItem value="SME">SME Banking</SelectItem>
            <SelectItem value="Retail">Retail Banking</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* BHR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array(3).fill(0).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6 h-64 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full bg-slate-200 mb-4" />
                <div className="h-6 w-40 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
              </CardContent>
            </Card>
          ))
        ) : filteredBHRs.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500">
            No BHRs found matching your search criteria
          </div>
        ) : (
          filteredBHRs.map(bhr => {
            // Generate avatar initials
            const initials = bhr.full_name
              .split(' ')
              .map(name => name.charAt(0))
              .slice(0, 1)
              .join('');
              
            return (
              <Card key={bhr.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
                      {initials}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-lg">{bhr.full_name}</h3>
                      </div>
                      <div className="text-sm text-slate-500">{bhr.e_code}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center text-sm text-slate-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {bhr.location}
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-slate-500 text-xs mb-1">Branches Mapped</div>
                      <div className="text-2xl font-bold">{bhr.branches_assigned}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-slate-500 text-xs mb-1">Reports Submitted</div>
                      <div className="text-2xl font-bold">{bhr.reports_stats?.total || 0}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="text-center bg-green-50 p-2 rounded-md">
                      <div className="text-xs text-green-700">Approved</div>
                      <div className="font-bold">{bhr.reports_stats?.approved || 0}</div>
                    </div>
                    <div className="text-center bg-blue-50 p-2 rounded-md">
                      <div className="text-xs text-blue-700">Pending</div>
                      <div className="font-bold">{bhr.reports_stats?.pending || 0}</div>
                    </div>
                    <div className="text-center bg-red-50 p-2 rounded-md">
                      <div className="text-xs text-red-700">Rejected</div>
                      <div className="font-bold">{bhr.reports_stats?.rejected || 0}</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="link" 
                      className="w-full text-blue-600 font-medium p-0 h-auto"
                      onClick={() => handleBHRClick(bhr.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* BHR Details Modal */}
      <BHRDetailsModal 
        bhId={selectedBHRId} 
        open={!!selectedBHRId} 
        onClose={() => setSelectedBHRId(null)}
      />
    </div>
  );
};

export default ZHBHRManagement;
