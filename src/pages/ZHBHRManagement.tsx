
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";

interface BHR {
  id: string;
  name: string;
  eCode: string;
  status: "Good" | "In Progress" | "Needs Attention";
  location: string;
  channel: string;
  branchesMapped: number;
  visitsCompleted: number;
  avatar: string;
}

const BHRDetailsModal = ({ bhr, open, onClose }: { bhr: BHR | null, open: boolean, onClose: () => void }) => {
  if (!bhr) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good": return "text-green-700 bg-green-100";
      case "In Progress": return "text-blue-700 bg-blue-100";
      case "Needs Attention": return "text-red-700 bg-red-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  const branchesAssigned = [
    { name: "Andheri Branch", category: "Gold", lastVisit: "15 Apr 2025", status: "Completed" },
    { name: "Bandra Branch", category: "Platinum", lastVisit: "10 Apr 2025", status: "Completed" },
    { name: "Juhu Branch", category: "Silver", lastVisit: "5 Apr 2025", status: "Scheduled" },
    { name: "Dadar Branch", category: "Bronze", lastVisit: "1 Apr 2025", status: "Overdue" },
    { name: "Worli Branch", category: "Diamond", lastVisit: "28 Mar 2025", status: "Completed" }
  ];

  const visitHistory = [
    { branch: "Andheri Branch", date: "15 Apr 2025", rating: "Good", feedback: "Good team coordination" },
    { branch: "Bandra Branch", date: "10 Apr 2025", rating: "Excellent", feedback: "Exceptional performance" },
    { branch: "Worli Branch", date: "28 Mar 2025", rating: "Good", feedback: "Meeting targets" }
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 bg-blue-600 text-white">
              <span>{bhr.avatar}</span>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{bhr.name}</DialogTitle>
              <p className="text-sm text-slate-500">{bhr.eCode} • {bhr.location}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge className={getStatusColor(bhr.status)}>
              {bhr.status}
            </Badge>
            <Badge variant="outline">{bhr.channel}</Badge>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">Branches Mapped</p>
                <p className="text-2xl font-bold">{bhr.branchesMapped}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500 mb-1">Visits Completed</p>
                <p className="text-2xl font-bold">{bhr.visitsCompleted}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="branches">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="branches">Assigned Branches</TabsTrigger>
              <TabsTrigger value="visits">Visit History</TabsTrigger>
            </TabsList>
            <TabsContent value="branches">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchesAssigned.map((branch, i) => (
                      <TableRow key={i}>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell>{branch.category}</TableCell>
                        <TableCell>{branch.lastVisit}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={
                              branch.status === "Completed" ? "text-green-700 bg-green-100" : 
                              branch.status === "Scheduled" ? "text-blue-700 bg-blue-100" : 
                              "text-red-700 bg-red-100"
                            }
                          >
                            {branch.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="visits">
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch</TableHead>
                      <TableHead>Visit Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitHistory.map((visit, i) => (
                      <TableRow key={i}>
                        <TableCell>{visit.branch}</TableCell>
                        <TableCell>{visit.date}</TableCell>
                        <TableCell>{visit.rating}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{visit.feedback}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ZHBHRManagement = () => {
  const [selectedBHR, setSelectedBHR] = useState<BHR | null>(null);
  
  // Sample BHR data
  const bhrs: BHR[] = [
    {
      id: "1",
      name: "Amit Kumar",
      eCode: "E42150",
      status: "In Progress",
      location: "Kolkata",
      channel: "Corporate Banking",
      branchesMapped: 18,
      visitsCompleted: 10,
      avatar: "A"
    },
    {
      id: "2",
      name: "Priya Sharma",
      eCode: "E85638",
      status: "Needs Attention",
      location: "Delhi",
      channel: "Rural Banking",
      branchesMapped: 17,
      visitsCompleted: 8,
      avatar: "P"
    },
    {
      id: "3",
      name: "Rajesh Patel",
      eCode: "E77713",
      status: "Good",
      location: "Delhi",
      channel: "SME Banking",
      branchesMapped: 7,
      visitsCompleted: 12,
      avatar: "R"
    }
  ];

  const handleViewDetails = (bhr: BHR) => {
    setSelectedBHR(bhr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Good": return "text-green-700 bg-green-100";
      case "In Progress": return "text-blue-700 bg-blue-100";
      case "Needs Attention": return "text-red-700 bg-red-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">BHR Management</h1>
        <p className="text-slate-600 mt-1">Monitor and manage Branch HR representatives</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input className="pl-9" placeholder="Search by name, email, or ID..." />
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
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="corporate">Corporate Banking</SelectItem>
                <SelectItem value="retail">Retail Banking</SelectItem>
                <SelectItem value="sme">SME Banking</SelectItem>
                <SelectItem value="rural">Rural Banking</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* BHR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bhrs.map((bhr) => (
          <Card key={bhr.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-12 w-12 bg-blue-600 text-white">
                    <span>{bhr.avatar}</span>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{bhr.name}</h3>
                    <p className="text-sm text-slate-500">{bhr.eCode}</p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Badge className={getStatusColor(bhr.status)}>
                    {bhr.status}
                  </Badge>
                  <p className="text-sm mt-2">{bhr.location}, {bhr.channel}</p>
                </div>

                <div>
                  <p className="text-sm font-medium mb-1">Branch Visit Coverage</p>
                  <p className="text-lg font-bold mb-3">{bhr.visitsCompleted}/{bhr.branchesMapped} branches</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Branches Mapped</p>
                      <p className="text-xl font-bold">{bhr.branchesMapped}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Visits Completed</p>
                      <p className="text-xl font-bold">{bhr.visitsCompleted}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="border-t px-6 py-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center"
                  onClick={() => handleViewDetails(bhr)}
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Details Modal */}
      <BHRDetailsModal 
        bhr={selectedBHR} 
        open={!!selectedBHR} 
        onClose={() => setSelectedBHR(null)} 
      />
    </div>
  );
};

export default ZHBHRManagement;
