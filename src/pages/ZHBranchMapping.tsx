
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Branch {
  id: string; 
  name: string;
  category: string;
  location: string;
  assignedBHR?: string | null;
  assignedBHRId?: string | null;
}

interface BHR {
  id: string;
  full_name: string;
  e_code: string;
}

const ZHBranchMapping = () => {
  const [showUnassigned, setShowUnassigned] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedBHR, setSelectedBHR] = useState<string>("");

  // Fetch branches from Supabase
  const { data: branches, isLoading, refetch } = useQuery({
    queryKey: ['branches-mapping'],
    queryFn: async () => {
      try {
        const { data: branchAssignments, error: assignmentsError } = await supabase
          .from('branch_assignments')
          .select(`
            id,
            branch_id,
            user_id,
            profiles:user_id(id, full_name)
          `);

        if (assignmentsError) throw assignmentsError;

        // Create a map of branch_id to BHR
        const branchToBHR: Record<string, { id: string, name: string }> = {};
        branchAssignments?.forEach(assignment => {
          if (assignment.profiles) {
            branchToBHR[assignment.branch_id] = { 
              id: assignment.user_id,
              name: (assignment.profiles as any).full_name || 'Unknown'
            };
          }
        });

        // Fetch all branches
        const { data: branchData, error: branchError } = await supabase
          .from('branches')
          .select('*');

        if (branchError) throw branchError;

        // Map the branches with their assignments
        const mappedBranches: Branch[] = (branchData || []).map(branch => ({
          id: branch.id,
          name: branch.name,
          category: branch.category.charAt(0).toUpperCase() + branch.category.slice(1),
          location: branch.location,
          assignedBHR: branchToBHR[branch.id]?.name || null,
          assignedBHRId: branchToBHR[branch.id]?.id || null
        }));

        return mappedBranches;
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load branches: ${error.message}`,
        });
        return [];
      }
    }
  });

  // Fetch BHRs from Supabase
  const { data: bhrs } = useQuery({
    queryKey: ['bhrs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, e_code')
          .eq('role', 'BH');

        if (error) throw error;
        return data || [];
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

  // Filter branches based on search term, category, location, and unassigned status
  const filteredBranches = React.useMemo(() => {
    if (!branches) return [];

    return branches.filter(branch => {
      // Filter by search term
      const matchesSearch = searchTerm === "" || 
        branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (branch.assignedBHR && branch.assignedBHR.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by category
      const matchesCategory = selectedCategory === "" || branch.category.toLowerCase() === selectedCategory.toLowerCase();
      
      // Filter by location
      const matchesLocation = selectedLocation === "" || branch.location === selectedLocation;
      
      // Filter by unassigned status if checkbox is checked
      const matchesUnassigned = !showUnassigned || !branch.assignedBHR;
      
      return matchesSearch && matchesCategory && matchesLocation && matchesUnassigned;
    });
  }, [branches, searchTerm, selectedCategory, selectedLocation, showUnassigned]);

  // Extract unique locations for the dropdown
  const uniqueLocations = React.useMemo(() => {
    if (!branches) return [];
    const locations = new Set(branches.map(branch => branch.location));
    return Array.from(locations);
  }, [branches]);

  // Helper function to get badge color based on category
  const getCategoryColor = (category: string) => {
    const categoryColors: Record<string, string> = {
      "Platinum": "text-purple-700 bg-purple-100",
      "Diamond": "text-blue-700 bg-blue-100",
      "Gold": "text-yellow-700 bg-yellow-100",
      "Silver": "text-gray-700 bg-gray-100",
      "Bronze": "text-orange-700 bg-orange-100"
    };
    return categoryColors[category] || "";
  };

  const handleAssignClick = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedBHR(branch.assignedBHRId || "");
    setIsAssignDialogOpen(true);
  };

  const handleAssignBHR = async () => {
    if (!selectedBranch || !selectedBHR) {
      toast({
        title: "Error",
        description: "Please select a BHR to assign",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check if branch already has an assignment
      if (selectedBranch.assignedBHRId) {
        // Update existing assignment
        const { error: updateError } = await supabase
          .from('branch_assignments')
          .update({
            user_id: selectedBHR,
            assigned_at: new Date().toISOString()
          })
          .eq('branch_id', selectedBranch.id);

        if (updateError) throw updateError;
      } else {
        // Create new assignment
        const { error: insertError } = await supabase
          .from('branch_assignments')
          .insert({
            branch_id: selectedBranch.id,
            user_id: selectedBHR,
            assigned_at: new Date().toISOString()
          });

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Branch assignment updated successfully",
      });

      // Refetch branches to update the UI
      refetch();
      setIsAssignDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to assign BHR: ${error.message}`,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Branch Mapping</h1>
        <p className="text-slate-600 mt-1">Assign BHRs to branches for visit management</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input 
              placeholder="Search branches or BHRs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-40">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="platinum">Platinum</SelectItem>
                <SelectItem value="diamond">Diamond</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
              </SelectContent>
            </Select>
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
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="show-unassigned" 
            checked={showUnassigned}
            onCheckedChange={(checked) => setShowUnassigned(!!checked)}
          />
          <Label htmlFor="show-unassigned">Show only unassigned branches</Label>
        </div>
      </div>

      {/* Branch Mapping Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Assigned BHR</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  Loading branches...
                </TableCell>
              </TableRow>
            ) : filteredBranches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No branches found matching the filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredBranches.map((branch, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{branch.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(branch.category)} variant="outline">
                      {branch.category}
                    </Badge>
                  </TableCell>
                  <TableCell>{branch.location}</TableCell>
                  <TableCell>
                    {branch.assignedBHR ? branch.assignedBHR : (
                      <span className="text-red-500">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAssignClick(branch)}
                    >
                      {branch.assignedBHR ? "Reassign" : "Assign"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Assign BHR Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedBranch?.assignedBHR ? "Reassign BHR" : "Assign BHR"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-2">
              Branch: <span className="font-medium">{selectedBranch?.name}</span>
            </p>
            <p className="mb-4">
              Category: <span className="font-medium">{selectedBranch?.category}</span>, 
              Location: <span className="font-medium">{selectedBranch?.location}</span>
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="bhr-select">Select BHR to assign</Label>
              <Select value={selectedBHR} onValueChange={setSelectedBHR}>
                <SelectTrigger id="bhr-select">
                  <SelectValue placeholder="Select BHR" />
                </SelectTrigger>
                <SelectContent>
                  {bhrs?.map((bhr) => (
                    <SelectItem key={bhr.id} value={bhr.id}>
                      {bhr.full_name} ({bhr.e_code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignBHR}>
              {selectedBranch?.assignedBHR ? "Reassign" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ZHBranchMapping;
