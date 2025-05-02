
import React from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  locationFilter: string;
  onLocationFilterChange: (value: string) => void;
  locations: string[];
}

const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationFilterChange,
  locations
}: SearchFilterBarProps) => {
  return (
    <Card className="mb-6 hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Search by name or employee code..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 border-slate-300"
            />
          </div>
          <div className="w-full md:w-60">
            <Select value={locationFilter} onValueChange={onLocationFilterChange}>
              <SelectTrigger className="flex items-center border-slate-300">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filter by location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchFilterBar;
