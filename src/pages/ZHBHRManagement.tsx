
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
  is_active: boolean;
}

const ZHBHRManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBHId, setSelectedBHId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
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

  // Filter BHRs based on search query, location, and active status
  const filteredBHRs = bhUsers.filter((bhr) => {
    const matchesSearch = 
      !searchQuery || 
      bhr.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      bhr.e_code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLocation = 
      locationFilter === "all" || 
      bhr.location === locationFilter;
    
    const matchesActive = 
      activeFilter === "all" || 
      (activeFilter === "active" && bhr.is_active) || 
      (activeFilter === "inactive" && !bhr.is_active);
    
    return matchesSearch && matchesLocation && matchesActive;
  });

  return (
    <div className="px-6 py-8 md:px-8 lg:px-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">BHR Management</h1>
        <p className="text-slate-500 mt-2 text-lg">
          View and manage Branch Head Representatives in your zone
        </p>
      </div>
      
      <Card className="mb-8 border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" size={18} />
              <Input
                placeholder="Search by name or employee code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-200 focus:border-blue-400 transition-colors rounded-lg bg-slate-50 focus:bg-white"
              />
            </div>
            <div className="w-full md:w-60">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="flex items-center border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:border-blue-400 transition-all">
                  <Filter className="h-4 w-4 mr-2 text-blue-500" />
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
            <div className="w-full md:w-60">
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="flex items-center border-slate-200 rounded-lg bg-slate-50 hover:bg-white focus:border-blue-400 transition-all">
                  <User className="h-4 w-4 mr-2 text-blue-500" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All BHRs</SelectItem>
                  <SelectItem value="active">Active BHRs</SelectItem>
                  <SelectItem value="inactive">Inactive BHRs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {usersLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-blue-500">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mb-4"></div>
          <span className="text-slate-600 font-medium">Loading representatives...</span>
        </div>
      ) : filteredBHRs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-xl shadow-sm border border-slate-100">
          <div className="flex justify-center mb-4">
            <User className="h-16 w-16 text-slate-300" />
          </div>
          <h3 className="text-xl font-medium mb-2 text-slate-700">No BHRs found</h3>
          <p className="text-slate-500 max-w-md mx-auto">No Branch Head Representatives match your current filters.</p>
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
    <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 border-0 shadow-md rounded-xl ${bhr.is_active ? 'bg-gradient-to-b from-white to-slate-50' : 'bg-gradient-to-b from-white to-gray-50'}`}>
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className={`h-16 w-16 text-white text-xl shadow-md ${bhr.is_active ? 'bg-gradient-to-br from-blue-600 to-blue-500' : 'bg-gradient-to-br from-gray-600 to-gray-500'}`}>
              <AvatarFallback className={`text-lg font-semibold ${bhr.is_active ? 'bg-gradient-to-br from-blue-600 to-blue-500' : 'bg-gradient-to-br from-gray-600 to-gray-500'}`}>
                {bhr.full_name?.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <h3 className="text-xl font-semibold text-slate-800">{bhr.full_name}</h3>
                {bhr.is_active ? (
                  <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                ) : (
                  <Badge className="ml-2 bg-gray-100 text-gray-700">Inactive</Badge>
                )}
              </div>
              <p className="text-slate-500 font-medium">{bhr.e_code || 'No Employee Code'}</p>
            </div>
          </div>
          
          <div className="flex items-center text-slate-600 mb-5 bg-slate-100 px-3 py-2 rounded-lg">
            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
            <span className="font-medium">{bhr.location || 'No location assigned'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-600 mb-1 font-medium">Branches Mapped</p>
              <p className="text-3xl font-bold text-blue-700">{bhr.branches_assigned}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100">
              <p className="text-sm text-indigo-600 mb-1 font-medium">Reports Submitted</p>
              <p className="text-3xl font-bold text-indigo-700">
                {isLoading ? "..." : stats?.total || 0}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
              <p className="text-sm font-medium text-green-700">Approved</p>
              <p className="text-xl font-bold text-green-700">
                {isLoading ? "..." : stats?.approved || 0}
              </p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-center border border-blue-100">
              <p className="text-sm font-medium text-blue-700">Pending</p>
              <p className="text-xl font-bold text-blue-700">
                {isLoading ? "..." : stats?.pending || 0}
              </p>
            </div>
            <div className="bg-red-50 p-2 rounded-lg text-center border border-red-100">
              <p className="text-sm font-medium text-red-700">Rejected</p>
              <p className="text-xl font-bold text-red-700">
                {isLoading ? "..." : stats?.rejected || 0}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={onViewDetails} 
              className="w-full bg-white hover:bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400 font-medium"
            >
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
