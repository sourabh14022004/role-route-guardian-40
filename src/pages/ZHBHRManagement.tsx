
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchZoneBHRs } from "@/services/zhService";
import { useAuth } from "@/contexts/AuthContext";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";
import BHRCard from "@/components/zh/BHRCard";
import SearchFilterBar from "@/components/zh/SearchFilterBar";
import EmptyBHRState from "@/components/zh/EmptyBHRState";

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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-800 to-indigo-700 bg-clip-text text-transparent">BHR Management</h1>
        <p className="text-slate-600 mt-1">
          View and manage Branch Head Representatives
        </p>
      </div>
      
      <SearchFilterBar 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        locationFilter={locationFilter}
        onLocationFilterChange={setLocationFilter}
        locations={locations}
      />
      
      {usersLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="sr-only">Loading...</span>
        </div>
      ) : filteredBHRs.length === 0 ? (
        <EmptyBHRState />
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

export default ZHBHRManagement;
