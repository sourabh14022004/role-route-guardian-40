
import React, { useState } from "react";
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

const ZHBranchMapping = () => {
  const [showUnassigned, setShowUnassigned] = useState(false);

  // Sample data for branch mapping
  const branches = [
    { 
      name: "Central Branch - Mumbai", 
      category: "Silver", 
      location: "Lucknow", 
      assignedBHR: "Kiran Shah" 
    },
    { 
      name: "City Center - Delhi", 
      category: "Bronze", 
      location: "Pune", 
      assignedBHR: null 
    },
    { 
      name: "Business District - Bangalore", 
      category: "Bronze", 
      location: "Kolkata", 
      assignedBHR: "Vikram Malhotra" 
    },
    { 
      name: "Tech Park - Chennai", 
      category: "Platinum", 
      location: "Chennai", 
      assignedBHR: "Rajesh Patel" 
    },
    { 
      name: "Mall Road - Kolkata", 
      category: "Bronze", 
      location: "Pune", 
      assignedBHR: "Rahul Verma" 
    }
  ];

  const categoryColors: Record<string, string> = {
    "Platinum": "text-purple-700 bg-purple-100",
    "Diamond": "text-blue-700 bg-blue-100",
    "Gold": "text-yellow-700 bg-yellow-100",
    "Silver": "text-gray-700 bg-gray-100",
    "Bronze": "text-orange-700 bg-orange-100"
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
            <Input placeholder="Search branches or BHRs..." />
          </div>
          <div className="w-full sm:w-40">
            <Select>
              <SelectTrigger>
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
          <div className="w-full sm:w-40">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="mumbai">Mumbai</SelectItem>
                <SelectItem value="delhi">Delhi</SelectItem>
                <SelectItem value="bangalore">Bangalore</SelectItem>
                <SelectItem value="chennai">Chennai</SelectItem>
                <SelectItem value="kolkata">Kolkata</SelectItem>
                <SelectItem value="pune">Pune</SelectItem>
                <SelectItem value="lucknow">Lucknow</SelectItem>
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
            {branches.map((branch, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>
                  <Badge className={categoryColors[branch.category] || ""} variant="outline">
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
                  <Button variant="outline" size="sm">
                    {branch.assignedBHR ? "Reassign" : "Assign"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ZHBranchMapping;
