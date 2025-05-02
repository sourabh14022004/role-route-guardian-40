
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchBHRReportStats } from "@/services/reportService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface BHRUser {
  id: string;
  full_name: string;
  e_code: string;
  location: string;
  branches_assigned: number;
}

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
    <Card className="overflow-hidden hover:shadow-md transition-shadow border border-slate-200 rounded-xl animate-fade-in">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16 bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl shadow-md">
              <AvatarFallback>
                {bhr.full_name?.charAt(0) || 'B'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-slate-800">{bhr.full_name}</h3>
              <p className="text-slate-500">{bhr.e_code || 'No Employee Code'}</p>
            </div>
          </div>
          
          <div className="flex items-center text-slate-600 mb-5">
            <MapPin className="h-4 w-4 mr-2 text-slate-500" />
            <span>{bhr.location || 'No location assigned'}</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-3 rounded-lg shadow-sm">
              <p className="text-sm text-slate-600 mb-1">Branches Mapped</p>
              <p className="text-3xl font-bold text-blue-700">{bhr.branches_assigned}</p>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-3 rounded-lg shadow-sm">
              <p className="text-sm text-slate-600 mb-1">Reports Submitted</p>
              <p className="text-3xl font-bold text-blue-700">
                {isLoading ? (
                  <span className="inline-block h-8 w-16 bg-slate-200 animate-pulse-soft rounded"></span>
                ) : (
                  stats?.total || 0
                )}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-2 rounded-lg text-center shadow-sm">
              <p className="text-sm font-medium text-green-700">Approved</p>
              <p className="text-xl font-bold text-green-700">
                {isLoading ? (
                  <span className="inline-block h-6 w-8 bg-green-200/50 animate-pulse-soft rounded"></span>
                ) : (
                  stats?.approved || 0
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-2 rounded-lg text-center shadow-sm">
              <p className="text-sm font-medium text-blue-700">Pending</p>
              <p className="text-xl font-bold text-blue-700">
                {isLoading ? (
                  <span className="inline-block h-6 w-8 bg-blue-200/50 animate-pulse-soft rounded"></span>
                ) : (
                  stats?.pending || 0
                )}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-2 rounded-lg text-center shadow-sm">
              <p className="text-sm font-medium text-red-700">Rejected</p>
              <p className="text-xl font-bold text-red-700">
                {isLoading ? (
                  <span className="inline-block h-6 w-8 bg-red-200/50 animate-pulse-soft rounded"></span>
                ) : (
                  stats?.rejected || 0
                )}
              </p>
            </div>
          </div>
          
          <div className="border-t pt-4 flex justify-center">
            <Button 
              variant="outline" 
              onClick={onViewDetails} 
              className="w-full hover:bg-blue-50 hover:text-blue-600 transition-colors"
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

export default BHRCard;
