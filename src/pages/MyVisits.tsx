
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const MyVisits = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchCategory, setBranchCategory] = useState("");
  const [visits, setVisits] = useState<any[]>([]);
  const isMobile = useIsMobile();
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Branch Visits</h1>
          <p className="text-slate-600">View and manage your branch visit records</p>
        </div>
        
        <Button 
          onClick={() => navigate("/bh/new-visit")}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <FilePlus className="h-4 w-4" />
          New Visit
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="p-4 md:p-6 pt-4 pb-0 md:pt-6 md:pb-2">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
              <Input
                placeholder="Search branches or locations..."
                className="pl-9 w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto self-end">
              <span className="text-sm font-medium whitespace-nowrap">Filters</span>
              <Select
                value={branchCategory}
                onValueChange={setBranchCategory}
              >
                <SelectTrigger className="w-full md:w-[180px] border-slate-200">
                  <SelectValue placeholder="Branch category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="platinum">Platinum</SelectItem>
                  <SelectItem value="diamond">Diamond</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="bronze">Bronze</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 md:pt-4">
          {/* Mobile filter button */}
          {isMobile && (
            <div className="flex justify-end mb-4">
              <Button variant="outline" size="sm" className="text-xs flex gap-1.5 items-center">
                <Filter className="h-3 w-3" />
                More filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {visits.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-medium mb-2">No visits found matching your filters</h3>
          <p className="text-slate-500 mb-6">
            Try changing your search criteria or create a new branch visit record.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setBranchCategory("");
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Visit cards would go here */}
        </div>
      )}
    </div>
  );
};

export default MyVisits;
