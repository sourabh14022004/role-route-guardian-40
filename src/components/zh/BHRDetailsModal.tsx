import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Calendar, MapPin } from "lucide-react";

type BHR = Database['public']['Tables']['profiles']['Row'] & {
  branches_assigned?: number;
  visits_completed?: number;
};

type BHRVisit = {
  id: string;
  branch_name: string;
  visit_date: string;
  status: string;
  coverage_percentage: number;
};

interface BHRDetailsModalProps {
  bhId: string | null;
  open: boolean;
  onClose: () => void;
}

const BHRDetailsModal = ({ bhId, open, onClose }: BHRDetailsModalProps) => {
  // Fetch BHR details
  const { data: bhrDetails, isLoading: bhrLoading } = useQuery({
    queryKey: ['bhr-details', bhId],
    queryFn: async () => {
      if (!bhId) return null;
      
      try {
        // Get BHR profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', bhId)
          .single();
        
        if (profileError) throw profileError;
        
        // Get branch assignments
        const { data: assignments, error: assignmentError } = await supabase
          .from('branch_assignments')
          .select('branch_id')
          .eq('user_id', bhId);
        
        if (assignmentError) throw assignmentError;
        
        // Get completed visits
        const { data: visits, error: visitError } = await supabase
          .from('branch_visits')
          .select('id')
          .eq('user_id', bhId)
          .eq('status', 'approved');
        
        if (visitError) throw visitError;
        
        return {
          ...profile,
          branches_assigned: assignments?.length || 0,
          visits_completed: visits?.length || 0
        } as BHR;
      } catch (error) {
        console.error("Error fetching BHR details:", error);
        return null;
      }
    },
    enabled: !!bhId && open
  });

  // Fetch BHR's recent visits
  const { data: recentVisits, isLoading: visitsLoading } = useQuery({
    queryKey: ['bhr-recent-visits', bhId],
    queryFn: async () => {
      if (!bhId) return [];
      
      try {
        const { data, error } = await supabase
          .from('branch_visits')
          .select(`
            id,
            visit_date,
            status,
            manning_percentage,
            branches:branch_id(name)
          `)
          .eq('user_id', bhId)
          .order('visit_date', { ascending: false })
          .limit(5);
        
        if (error) throw error;
        
        return (data || []).map(visit => {
          // Correctly access the nested branch name
          const branchName = visit.branches ? 
            // Handle the case when branches is an object with a name property
            (typeof visit.branches === 'object' && visit.branches !== null && 'name' in visit.branches) ? 
              visit.branches.name : 'Unknown Branch' 
            : 'Unknown Branch';
            
          return {
            id: visit.id,
            branch_name: branchName,
            visit_date: new Date(visit.visit_date).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            }),
            status: visit.status || 'draft',
            coverage_percentage: visit.manning_percentage || 0
          };
        });
      } catch (error) {
        console.error("Error fetching BHR visits:", error);
        return [];
      }
    },
    enabled: !!bhId && open
  });

  // Early return if no BHR selected
  if (!bhId) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Submitted</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Draft</Badge>;
    }
  };

  const coveragePercentage = bhrDetails?.branches_assigned 
    ? Math.round((bhrDetails.visits_completed || 0) / bhrDetails.branches_assigned * 100)
    : 0;

  const getPerformanceStatus = () => {
    if (coveragePercentage >= 90) return "Good";
    if (coveragePercentage >= 70) return "In Progress";
    return "Needs Attention";
  };

  const getPerformanceStatusColor = (status: string) => {
    switch (status) {
      case "Good": return "bg-green-100 text-green-800";
      case "In Progress": return "bg-amber-100 text-amber-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  const performanceStatus = getPerformanceStatus();
  const statusColorClass = getPerformanceStatusColor(performanceStatus);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>BHR Details</DialogTitle>
        </DialogHeader>

        {bhrLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : !bhrDetails ? (
          <div className="py-8 text-center text-slate-500">
            No data available for this BHR
          </div>
        ) : (
          <>
            {/* BHR Profile */}
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
              <div className="flex-shrink-0 h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-2xl font-bold text-slate-700">
                {bhrDetails.full_name?.charAt(0) || 'B'}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
                  <h3 className="text-xl font-bold">{bhrDetails.full_name}</h3>
                  <Badge className={statusColorClass}>
                    {performanceStatus}
                  </Badge>
                </div>
                <div className="text-slate-600 mt-1 text-center md:text-left">{bhrDetails.e_code}</div>
                <div className="flex gap-2 items-center mt-2 text-slate-600 justify-center md:justify-start">
                  <MapPin className="h-4 w-4" />
                  <span>{bhrDetails.location}</span>
                </div>
                
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Branch Visit Coverage</span>
                    <span className="font-medium">
                      {bhrDetails.visits_completed}/{bhrDetails.branches_assigned} branches
                    </span>
                  </div>
                  <Progress 
                    value={coveragePercentage} 
                    className={`h-2 ${coveragePercentage >= 90 ? 'bg-green-200' : coveragePercentage >= 70 ? 'bg-blue-200' : 'bg-amber-200'}`}
                  />
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <div className="text-slate-500 text-sm">Branches Mapped</div>
                <div className="text-3xl font-bold mt-1">{bhrDetails.branches_assigned}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <div className="text-slate-500 text-sm">Visits Completed</div>
                <div className="text-3xl font-bold mt-1">{bhrDetails.visits_completed}</div>
              </div>
            </div>

            {/* Recent Visits */}
            <div className="mt-6">
              <h4 className="font-semibold text-lg mb-3">Recent Branch Visits</h4>
              
              {visitsLoading ? (
                <div className="flex justify-center py-4">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : recentVisits?.length === 0 ? (
                <div className="py-4 text-center text-slate-500 bg-slate-50 rounded-lg">
                  No recent visits found
                </div>
              ) : (
                <div className="space-y-3">
                  {recentVisits?.map((visit) => (
                    <Card key={visit.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{visit.branch_name}</div>
                            <div className="text-sm text-slate-500 flex items-center mt-1">
                              <Calendar className="h-3.5 w-3.5 mr-1" />
                              {visit.visit_date}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(visit.status)}
                            <span className="text-sm">
                              {visit.coverage_percentage}% coverage
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BHRDetailsModal;
