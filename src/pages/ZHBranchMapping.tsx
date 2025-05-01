
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin, X } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

const ZHBranchMapping = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch branches
  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branches")
        .select(`
          *,
          branch_assignments:branch_assignments(
            user_id,
            profiles:user_id(
              full_name,
              e_code
            )
          )
        `)
        .order("name");
        
      if (error) throw error;
      return data || [];
    },
  });
  
  // Fetch BHRs for dropdown
  const { data: bhrs, isLoading: bhrsLoading } = useQuery({
    queryKey: ["bhr-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, e_code")
        .eq("role", "BH")
        .order("full_name");
        
      if (error) throw error;
      return data || [];
    },
  });

  // Filter branches based on search query
  const filteredBranches = branches?.filter(branch => {
    const searchLower = searchQuery.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(searchLower) ||
      branch.location?.toLowerCase().includes(searchLower) ||
      branch.category?.toLowerCase().includes(searchLower)
    );
  }) || [];
  
  // Mutation to assign branch to BHR
  const assignBranchMutation = useMutation({
    mutationFn: async ({ branchId, userId }: { branchId: string, userId: string }) => {
      // First check if assignment already exists
      const { data: existingAssignment } = await supabase
        .from("branch_assignments")
        .select("*")
        .eq("branch_id", branchId);
      
      // If exists, update it
      if (existingAssignment && existingAssignment.length > 0) {
        const { error } = await supabase
          .from("branch_assignments")
          .update({ user_id: userId })
          .eq("branch_id", branchId);
          
        if (error) throw error;
      } else {
        // Create new assignment
        const { error } = await supabase
          .from("branch_assignments")
          .insert([{ branch_id: branchId, user_id: userId }]);
          
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Branch assigned",
        description: "Branch has been successfully assigned to BHR",
      });
    },
    onError: (error) => {
      console.error("Error assigning branch:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign branch. Please try again.",
      });
    },
  });

  // Mutation to remove branch assignment
  const removeBranchAssignmentMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const { error } = await supabase
        .from("branch_assignments")
        .delete()
        .eq("branch_id", branchId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast({
        title: "Assignment removed",
        description: "Branch assignment has been successfully removed",
      });
    },
    onError: (error) => {
      console.error("Error removing assignment:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove assignment. Please try again.",
      });
    },
  });
  
  // Format branch category
  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };
  
  // Get current assignee of a branch
  const getAssignee = (branch: any) => {
    if (!branch.branch_assignments || branch.branch_assignments.length === 0) {
      return null;
    }
    
    const assignment = branch.branch_assignments[0];
    return assignment.profiles || null;
  };

  // Handle branch assignment
  const handleBranchAssign = (branchId: string, userId: string) => {
    assignBranchMutation.mutate({ branchId, userId });
  };
  
  // Handle removing branch assignment
  const handleRemoveAssignment = (branchId: string) => {
    removeBranchAssignmentMutation.mutate(branchId);
  };
  
  // Loading state
  if (branchesLoading || bhrsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Branch Mapping</h1>
          <p className="text-slate-500">Assign branches to BHR representatives</p>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input 
            placeholder="Search branches..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBranches.map((branch) => {
                  const assignee = getAssignee(branch);
                  
                  return (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">{branch.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                          {branch.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`
                          ${branch.category === 'platinum' ? 'bg-violet-100 text-violet-800' : 
                            branch.category === 'diamond' ? 'bg-blue-100 text-blue-800' :
                            branch.category === 'gold' ? 'bg-amber-100 text-amber-800' :
                            branch.category === 'silver' ? 'bg-slate-200 text-slate-800' :
                            'bg-orange-100 text-orange-800'}
                        `}>
                          {formatCategory(branch.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{assignee.full_name}</span>
                            <span className="text-xs text-slate-500">({assignee.e_code})</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            onValueChange={(value) => handleBranchAssign(branch.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder="Assign BHR" />
                            </SelectTrigger>
                            <SelectContent>
                              {bhrs?.map((bhr) => (
                                <SelectItem key={bhr.id} value={bhr.id}>
                                  {bhr.full_name} ({bhr.e_code})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {assignee && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveAssignment(branch.id)}
                              title="Remove assignment"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ZHBranchMapping;
