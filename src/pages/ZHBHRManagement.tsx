
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchZoneBHRs } from "@/services/zhService";
import { fetchBHRReportStats } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, MapPin, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BHRUser {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
}

const ZHBHRManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBHId, setSelectedBHId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [locations, setLocations] = useState<string[]>([]);
  
  // Fetch BHRs data
  const { data: bhUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['zh-bhrs'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const bhrs = await fetchZoneBHRs(user.id);
      
      // Extract unique locations for filter dropdown
      const uniqueLocations = [...new Set(bhrs.map(bhr => bhr.location).filter(Boolean))];
      setLocations(uniqueLocations as string[]);
      
      return bhrs;
    },
    enabled: !!user?.id
  });

  // Filter BHRs based on search query and location
  const filteredBHRs = bhUsers.filter((bhr) => {
    const matchesSearch = 
      !searchQuery || 
      bhr.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      bhr.e_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = 
      locationFilter === "all" || 
      bhr.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  // Get statistics for each BHR
  const getBHRStats = async (bhId: string) => {
    try {
      return await fetchBHRReportStats(bhId);
    } catch (error) {
      console.error("Error fetching BHR stats:", error);
      return { total: 0, approved: 0, pending: 0, rejected: 0 };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">BHR Management</h1>
        <p className="text-slate-600 mt-1">
          View and manage Branch Head Representatives
        </p>
      </div>
      
      <Card className="mb-6 hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search by name or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="w-full md:w-60">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="flex items-center">
                  <Filter className="h-4 w-4 mr-2 text-slate-400" />
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {usersLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : filteredBHRs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white rounded-lg shadow-sm">
          <div className="flex justify-center mb-3">
            <User className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium mb-1">No BHRs found</h3>
          <p>No Branch Head Representatives match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBHRs.map((bhr) => (
            <BHRCard
              key={bhr.id}
              bhr={bhr}
              onViewDetails={() => setSelectedBHId(bhr.id)}
            />
          ))}
        </div>
      )}
      
      {/* BHR Details Modal */}
      <BHRDetailsModal
        bhId={selectedBHId}
        open={!!selectedBHId}
        onClose={() => setSelectedBHId(null)}
      />
    </div>
  );
};

// BHR Card Component
interface BHRCardProps {
  bhr: BHRUser;
  onViewDetails: () => void;
}

const BHRCard = ({ bhr, onViewDetails }: BHRCardProps) => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['bhr-stats', bhr.id],
    queryFn: async () => await fetchBHRReportStats(bhr.id),
  });

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border border-slate-200 rounded-xl">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 bg-blue-600/80 text-white text-xl">
              <AvatarFallback>
                {bhr.full_name?.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{bhr.full_name}</h3>
              <p className="text-slate-500">{bhr.e_code || 'No Employee Code'}</p>
            </div>
          </div>
          
          <div className="flex items-center text-slate-600 mb-5">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{bhr.location || 'No location assigned'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Branches Mapped</p>
              <p className="text-3xl font-bold text-blue-700">{bhr.branches_assigned}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600 mb-1">Reports Submitted</p>
              <p className="text-3xl font-bold text-blue-700">
                {isLoading ? "..." : stats?.total || 0}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-green-50 p-2 rounded-lg text-center">
              <p className="text-sm font-medium text-green-700">Approved</p>
              <p className="text-xl font-bold text-green-700">
                {isLoading ? "..." : stats?.approved || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-center">
              <p className="text-sm font-medium text-blue-700">Pending</p>
              <p className="text-xl font-bold text-blue-700">
                {isLoading ? "..." : stats?.pending || 0}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-center">
              <p className="text-sm font-medium text-red-700">Rejected</p>
              <p className="text-xl font-bold text-red-700">
                {isLoading ? "..." : stats?.rejected || 0}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-center">
            <Button variant="outline" onClick={onViewDetails} className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZHBHRManagement;
