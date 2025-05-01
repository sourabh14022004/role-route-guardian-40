import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MyVisits = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [branchCategory, setBranchCategory] = useState("");
  const [visits, setVisits] = useState<any[]>([]);
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4 md:mb-0">My Branch Visits</h1>
        <Button 
          onClick={() => navigate("/bh/new-visit")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Visit
        </Button>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>View and manage your branch visit records</CardTitle>
          <CardDescription>
            You can search for specific branches or filter by different attributes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search branches or locations..."
              className="md:max-w-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filters</span>
              <Select
                value={branchCategory}
                onValueChange={setBranchCategory}
              >
                <SelectTrigger className="w-[180px]">
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
        </CardContent>
      </Card>
      
      {visits.length === 0 ? (
        <div className="bg-muted/50 rounded-lg p-8 text-center">
          <h3 className="text-xl font-medium mb-2">No visits found matching your filters</h3>
          <p className="text-muted-foreground mb-6">
            Try changing your search criteria or create a new branch visit record.
          </p>
          <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setBranchCategory("");
          }}>
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
