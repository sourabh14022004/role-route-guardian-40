
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchZoneBHRs } from "@/services/zhService";
import { fetchBHRReportStats } from "@/services/reportService";
import { useAuth } from "@/contexts/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Eye, User } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BHRDetailsModal from "@/components/zh/BHRDetailsModal";
import { supabase } from "@/integrations/supabase/client";

interface BHRUser {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
  email: string;
}

const ZHBHRManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBHId, setSelectedBHId] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
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
      
      return bhrs as BHRUser[];
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
      !locationFilter || 
      bhr.location === locationFilter;
    
    return matchesSearch && matchesLocation;
  });

  // Get statistics for each BHR
  const getBHRStats = async (bhId: string) => {
    try {
      return await fetchBHRReportStats(bhId);
    } catch (error) {
      console.error("Error fetching BHR stats:", error);
      return { total: 0, approved: 0, pending: 0, rejected: 0, draft: 0 };
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
                  <SelectItem value="">All Locations</SelectItem>
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
      
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle>Branch Head Representatives</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Employee Code</TableHead>
                  <TableHead className="font-medium">Location</TableHead>
                  <TableHead className="font-medium">Assigned Branches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBHRs.map((bhr) => (
                  <TableRow key={bhr.id} className="hover:bg-slate-50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
                          {bhr.full_name?.charAt(0) || 'B'}
                        </div>
                        {bhr.full_name}
                      </div>
                    </TableCell>
                    <TableCell>{bhr.e_code || 'N/A'}</TableCell>
                    <TableCell>{bhr.location || 'Not assigned'}</TableCell>
                    <TableCell>
                      {bhr.branches_assigned > 0 ? (
                        <Badge className="bg-blue-100 text-blue-800">
                          {bhr.branches_assigned} branch{bhr.branches_assigned !== 1 ? 'es' : ''}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          No branches
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedBHId(bhr.id)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
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
