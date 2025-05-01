
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
import { FilePlus, Search, Filter, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MyVisits = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchCategory, setBranchCategory] = useState("");
  const [month, setMonth] = useState("");
  const [status, setStatus] = useState("");
  const [visits, setVisits] = useState<any[]>([]);
  const isMobile = useIsMobile();
  
  const resetFilters = () => {
    setSearchQuery("");
    setBranchCategory("");
    setMonth("");
    setStatus("");
  };
  
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
              {!isMobile ? (
                <>
                  <span className="text-sm font-medium whitespace-nowrap">Filters</span>
                  <Select
                    value={month}
                    onValueChange={setMonth}
                  >
                    <SelectTrigger className="border-slate-200 w-[150px]">
                      <SelectValue placeholder="All Months" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      <SelectItem value="january">January</SelectItem>
                      <SelectItem value="february">February</SelectItem>
                      <SelectItem value="march">March</SelectItem>
                      <SelectItem value="april">April</SelectItem>
                      <SelectItem value="may">May</SelectItem>
                      <SelectItem value="june">June</SelectItem>
                      <SelectItem value="july">July</SelectItem>
                      <SelectItem value="august">August</SelectItem>
                      <SelectItem value="september">September</SelectItem>
                      <SelectItem value="october">October</SelectItem>
                      <SelectItem value="november">November</SelectItem>
                      <SelectItem value="december">December</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={branchCategory}
                    onValueChange={setBranchCategory}
                  >
                    <SelectTrigger className="border-slate-200 w-[150px]">
                      <SelectValue placeholder="All Categories" />
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
                  
                  <Select
                    value={status}
                    onValueChange={setStatus}
                  >
                    <SelectTrigger className="border-slate-200 w-[150px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-2 md:pt-4">
          {/* Mobile filter dropdown */}
          {isMobile && (
            <div className="flex justify-end mb-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs flex gap-1.5 items-center">
                    <Filter className="h-3 w-3" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuGroup>
                    <div className="p-2">
                      <p className="text-xs font-medium mb-2">Month</p>
                      <Select
                        value={month}
                        onValueChange={setMonth}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Months" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Months</SelectItem>
                          <SelectItem value="january">January</SelectItem>
                          <SelectItem value="february">February</SelectItem>
                          <SelectItem value="march">March</SelectItem>
                          <SelectItem value="april">April</SelectItem>
                          <SelectItem value="may">May</SelectItem>
                          <SelectItem value="june">June</SelectItem>
                          <SelectItem value="july">July</SelectItem>
                          <SelectItem value="august">August</SelectItem>
                          <SelectItem value="september">September</SelectItem>
                          <SelectItem value="october">October</SelectItem>
                          <SelectItem value="november">November</SelectItem>
                          <SelectItem value="december">December</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium mb-2">Branch Category</p>
                      <Select
                        value={branchCategory}
                        onValueChange={setBranchCategory}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Categories" />
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
                    <div className="p-2">
                      <p className="text-xs font-medium mb-2">Status</p>
                      <Select
                        value={status}
                        onValueChange={setStatus}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-2 pt-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
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
            onClick={resetFilters}
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
