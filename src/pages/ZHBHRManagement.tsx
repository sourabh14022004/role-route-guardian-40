
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface BHR {
  id: string;
  name: string;
  eCode: string;
  location: string;
  channel: string;
  branchesMapped: number;
  avatar: string;
}

interface Visit {
  branch: string;
  date: string;
  rating: string;
  feedback: string;
}

interface ReportDetailsProps {
  visit: Visit | null;
  open: boolean;
  onClose: () => void;
}

const ReportDetailsModal = ({ visit, open, onClose }: ReportDetailsProps) => {
  if (!visit) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Visit Report Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">Branch</p>
              <p className="text-lg font-medium">{visit.branch}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Visit Date</p>
              <p className="text-lg font-medium">{visit.date}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rating</p>
              <p className="text-lg font-medium">{visit.rating}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Feedback</p>
            <p className="text-base mt-1">{visit.feedback}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BHRDetailsModal = ({ bhr, open, onClose }: { bhr: BHR | null, open: boolean, onClose: () => void }) => {
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  
  if (!bhr) return null;

  // Sample data (would be replaced with real data from Supabase in a real implementation)
  const branchesAssigned = [
    { name: "Andheri Branch", category: "Gold", lastVisit: "15 Apr 2025", status: "Completed" },
    { name: "Bandra Branch", category: "Platinum", lastVisit: "10 Apr 2025", status: "Completed" },
    { name: "Juhu Branch", category: "Silver", lastVisit: "5 Apr 2025", status: "Scheduled" },
    { name: "Dadar Branch", category: "Bronze", lastVisit: "1 Apr 2025", status: "Overdue" },
    { name: "Worli Branch", category: "Diamond", lastVisit: "28 Mar 2025", status: "Completed" }
  ];

  const visitHistory = [
    { branch: "Andheri Branch", date: "15 Apr 2025", rating: "Good", feedback: "Good team coordination" },
    { branch: "Bandra Branch", date: "10 Apr 2025", rating: "Excellent", feedback: "Exceptional performance" },
    { branch: "Worli Branch", date: "28 Mar 2025", rating: "Good", feedback: "Meeting targets" }
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 bg-blue-600 text-white">
              <span>{bhr.avatar}</span>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{bhr.name}</DialogTitle>
              <p className="text-sm text-slate-500">{bhr.eCode} • {bhr.location}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="outline">{bhr.channel}</Badge>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-500 mb-1">Branches Mapped</p>
              <p className="text-2xl font-bold">{bhr.branchesMapped}</p>
            </CardContent>
          </Card>

          <Tabs defaultValue="branches">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="branches">Assigned Branches</TabsTrigger>
              <TabsTrigger value="visits">Visit History</TabsTrigger>
            </TabsList>
            <TabsContent value="branches">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchesAssigned.map((branch, i) => (
                      <TableRow key={i}>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>{branch.category}</TableCell>
                        <TableCell>{branch.lastVisit}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              branch.status === "Completed" ? "text-green-700 bg-green-100" : 
                              branch.status === "Scheduled" ? "text-blue-700 bg-blue-100" : 
                              "text-red-700 bg-red-100"
                            }
                          >
                            {branch.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="visits">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitHistory.map((visit, i) => (
                      <TableRow key={i}>
                        <TableCell>{visit.branch}</TableCell>
                        <TableCell>{visit.date}</TableCell>
                        <TableCell>{visit.rating}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedVisit(visit)}
                            className="flex items-center gap-1"
                          >
                            View Report
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>

      {/* Report Details Modal */}
      <ReportDetailsModal
        visit={selectedVisit}
        open={!!selectedVisit}
        onClose={() => setSelectedVisit(null)}
      />
    </Dialog>
  );
};

const ZHBHRManagement = () => {
  const [selectedBHR, setSelectedBHR] = useState<BHR | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  
  // Fetch BHR data from Supabase
  const { data: bhrData, isLoading } = useQuery({
    queryKey: ['zh-bhr-management'],
    queryFn: async () => {
      try {
        // Fetch all profiles with role 'BH'
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'BH');
        
        if (profilesError) throw profilesError;
        
        // Get branch assignments for each BHR to count branches mapped
        const bhrMappedBranches: Record<string, number> = {};
        
        for (const profile of profiles || []) {
          const { data: assignments, error: assignmentsError } = await supabase
            .from('branch_assignments')
            .select('branch_id')
            .eq('user_id', profile.id);
          
          if (assignmentsError) throw assignmentsError;
          
          bhrMappedBranches[profile.id] = assignments?.length || 0;
        }
        
        // Format the data
        const formattedData = (profiles || []).map(profile => ({
          id: profile.id,
          name: profile.full_name,
          eCode: profile.e_code,
          location: profile.location,
          channel: profile.department || "General Banking", // Assuming department is used as channel
          branchesMapped: bhrMappedBranches[profile.id] || 0,
          avatar: profile.full_name.charAt(0).toUpperCase()
        }));
        
        return formattedData;
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load BHRs: ${error.message}`,
        });
        return [];
      }
    }
  });

  // Extract unique locations for the dropdown
  const uniqueLocations = React.useMemo(() => {
    if (!bhrData) return [];
    const locations = new Set(bhrData.map(bhr => bhr.location));
    return Array.from(locations);
  }, [bhrData]);

  // Extract unique channels for the dropdown
  const uniqueChannels = React.useMemo(() => {
    if (!bhrData) return [];
    const channels = new Set(bhrData.map(bhr => bhr.channel));
    return Array.from(channels);
  }, [bhrData]);

  // Filter BHRs based on search term, location, and channel
  const filteredBHRs = React.useMemo(() => {
    if (!bhrData) return [];

    return bhrData.filter(bhr => {
      const matchesSearch = searchTerm === "" || 
        bhr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bhr.eCode.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = selectedLocation === "" || bhr.location === selectedLocation;
      const matchesChannel = selectedChannel === "" || bhr.channel === selectedChannel;
      
      return matchesSearch && matchesLocation && matchesChannel;
    });
  }, [bhrData, searchTerm, selectedLocation, selectedChannel]);

  const handleViewDetails = (bhr: BHR) => {
    setSelectedBHR(bhr);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">BHR Management</h1>
        <p className="text-slate-600 mt-1">Monitor and manage Branch HR representatives</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              className="pl-9" 
              placeholder="Search by name, email, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Locations</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location} value={location}>{location}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
              <SelectTrigger>
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Channels</SelectItem>
                {uniqueChannels.map(channel => (
                  <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* BHR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="col-span-3 text-center py-10 text-slate-500">Loading BHRs...</p>
        ) : filteredBHRs.length === 0 ? (
          <p className="col-span-3 text-center py-10 text-slate-500">No BHRs found matching filters</p>
        ) : (
          filteredBHRs.map((bhr) => (
            <Card key={bhr.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12 bg-blue-600 text-white">
                      <span>{bhr.avatar}</span>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{bhr.name}</h3>
                      <p className="text-sm text-slate-500">{bhr.eCode}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm mt-2">{bhr.location}, {bhr.channel}</p>
                  </div>

                  <div>
                    <p className="text-lg font-bold mb-3">Branches Mapped: {bhr.branchesMapped}</p>
                  </div>
                </div>
                
                <div className="border-t px-6 py-3">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={() => handleViewDetails(bhr)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Details Modal */}
      <BHRDetailsModal 
        bhr={selectedBHR} 
        open={!!selectedBHR} 
        onClose={() => setSelectedBHR(null)} 
      />
    </div>
  );
};

export default ZHBHRManagement;
