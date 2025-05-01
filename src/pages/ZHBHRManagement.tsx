
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchZoneBHRs } from "@/services/zhService";
import { fetchBHRReportStats } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, User, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";
import { supabase } from "@/integrations/supabase/client";

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
        <div className="py-12 text-center text-slate-500">
          <div className="flex justify-center mb-3">
            <User className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium mb-1">No BHRs found</h3>
          <p>No Branch Head Representatives match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBHRs.map((bhr) => (
            <Card key={bhr.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl mr-4 flex-shrink-0">
                    {bhr.full_name?.charAt(0) || 'B'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg truncate">{bhr.full_name}</h3>
                    <p className="text-sm text-slate-500 mb-1">{bhr.e_code || 'No employee code'}</p>
                    {bhr.location && (
                      <div className="flex items-center text-sm text-slate-600 mb-3">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        {bhr.location}
                      </div>
                    )}
                    
                    <div className="my-3">
                      {bhr.branches_assigned > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          {bhr.branches_assigned} branch{bhr.branches_assigned !== 1 ? 'es' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          No branches
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedBHId(bhr.id)}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
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
