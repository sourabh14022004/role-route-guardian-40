
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Search, User, MapPin } from "lucide-react";
import { fetchZoneBHRs } from "@/services/zhService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

type BHUser = {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  gender: string;
  branches_assigned: number;
};

const ZHBHRManagement = () => {
  const { user } = useAuth();
  
  // Data states
  const [bhUsers, setBHUsers] = useState<BHUser[]>([]);
  const [filteredBHUsers, setFilteredBHUsers] = useState<BHUser[]>([]);
  const [selectedBHUser, setSelectedBHUser] = useState<BHUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [assignedBranches, setAssignedBranches] = useState<any[]>([]);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const bhUsersData = await fetchZoneBHRs(user.id);
        setBHUsers(bhUsersData);
        setFilteredBHUsers(bhUsersData);
      } catch (error) {
        console.error("Error loading BHR data:", error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "Failed to load BHR data. Please try again."
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [user]);
  
  // Filter BHRs when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBHUsers(bhUsers);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = bhUsers.filter(
      bhr => bhr.full_name.toLowerCase().includes(query) || 
             bhr.e_code.toLowerCase().includes(query)
    );
    
    setFilteredBHUsers(filtered);
  }, [bhUsers, searchQuery]);
  
  // Load assigned branches for a specific BHR
  const fetchBHRBranches = async (bhrId: string) => {
    try {
      const { data, error } = await supabase
        .from('branch_assignments')
        .select(`
          branch_id,
          branches (
            id,
            name,
            location,
            category
          )
        `)
        .eq('user_id', bhrId);
        
      if (error) throw error;
      
      return data.map((item: any) => item.branches);
    } catch (error) {
      console.error("Error fetching BHR's branches:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load assigned branches."
      });
      return [];
    }
  };
  
  const handleViewDetails = async (bhr: BHUser) => {
    setSelectedBHUser(bhr);
    
    try {
      const branches = await fetchBHRBranches(bhr.id);
      setAssignedBranches(branches);
      setDetailsDialogOpen(true);
    } catch (error) {
      console.error("Error loading BHR details:", error);
    }
  };
  
  // Function to format branch category names
  const formatCategoryName = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <div className="flex flex-col items-center">
          <div className="h-8 w-8 rounded-full border-4 border-t-blue-600 border-b-blue-600 border-r-transparent border-l-transparent animate-spin"></div>
          <p className="mt-4 text-sm text-slate-600">Loading BHR data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">BHR Management</h1>
        <p className="text-slate-600">Manage Branch Head Representatives in your zone</p>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Branch Head Representatives</CardTitle>
          <CardDescription>View and manage BHRs in your zone</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
            <Input
              placeholder="Search by name or E-Code..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Name</TableHead>
                  <TableHead>E-Code</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead className="text-center">Branches Assigned</TableHead>
                  <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBHUsers.length > 0 ? (
                  filteredBHUsers.map((bhr) => (
                    <TableRow key={bhr.id}>
                      <TableCell className="font-medium">{bhr.full_name}</TableCell>
                      <TableCell>{bhr.e_code}</TableCell>
                      <TableCell className="capitalize">{bhr.gender}</TableCell>
                      <TableCell className="text-center">{bhr.branches_assigned}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(bhr)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                      {searchQuery ? 
                        "No BHRs match your search criteria" : 
                        "No BHRs available in your zone"
                      }
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* BHR Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>BHR Details</DialogTitle>
            <DialogDescription>
              Details for {selectedBHUser?.full_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBHUser && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{selectedBHUser.full_name}</h3>
                      <p className="text-sm text-slate-600">{selectedBHUser.e_code}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="text-sm capitalize">{selectedBHUser.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Role</p>
                      <p className="text-sm">BH</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-green-100 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-sm text-slate-600">{selectedBHUser.location}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Branches Assigned</p>
                    <p className="text-sm">{selectedBHUser.branches_assigned}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Assigned Branches</h3>
                {assignedBranches.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Branch Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignedBranches.map((branch: any) => (
                          <TableRow key={branch.id}>
                            <TableCell className="font-medium">{branch.name}</TableCell>
                            <TableCell>{branch.location}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                branch.category === 'platinum' ? 'bg-violet-100 text-violet-700' : 
                                branch.category === 'diamond' ? 'bg-blue-100 text-blue-700' :
                                branch.category === 'gold' ? 'bg-amber-100 text-amber-700' :
                                branch.category === 'silver' ? 'bg-slate-100 text-slate-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {formatCategoryName(branch.category)}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-md bg-slate-50">
                    <p className="text-slate-500">No branches assigned to this BHR yet</p>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZHBHRManagement;
