
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

const ZHDashboard = () => {
  const { user } = useAuth();

  // Sample data for the dashboard
  const bhrData = [
    { id: "BHR01", name: "Amit Singh", completed: 8, total: 10, progress: 80 },
    { id: "BHR02", name: "Priya Sharma", completed: 7, total: 8, progress: 87 },
    { id: "BHR03", name: "Raj Patel", completed: 5, total: 6, progress: 83 },
    { id: "BHR04", name: "Neha Gupta", completed: 9, total: 12, progress: 75 },
    { id: "BHR05", name: "Karan Shah", completed: 4, total: 9, progress: 44 },
  ];

  const branchCategories = [
    { category: "Platinum", count: 7 },
    { category: "Diamond", count: 10 },
    { category: "Gold", count: 14 },
    { category: "Silver", count: 12 },
    { category: "Bronze", count: 5 },
  ];

  const unmappedBranches = [
    { id: "072", name: "Branch 072 - Kurla", category: "Silver" },
    { id: "114", name: "Branch 114 - Thane", category: "Gold" },
    { id: "093", name: "Branch 093 - Powai", category: "Bronze" },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, Zonal HR User</h1>
        <p className="text-slate-600 mt-1">Manage branch assignments and monitor BHR performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total BHRs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">12</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Active BHRs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Total Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">48</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Unmapped Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">3</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Branch Visit Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>BH Assigned</TableHead>
                    <TableHead>Last Report</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { branch: "Andheri", bh: "Amit Singh", date: "15 Apr 2025", status: "Approved" },
                    { branch: "Juhu", bh: "Priya Sharma", date: "12 Apr 2025", status: "Pending" },
                    { branch: "Bandra", bh: "Raj Patel", date: "10 Apr 2025", status: "Approved" },
                    { branch: "Worli", bh: "Neha Gupta", date: "8 Apr 2025", status: "Approved" },
                    { branch: "Dadar", bh: "Karan Shah", date: "5 Apr 2025", status: "Pending" },
                  ].map((report, i) => (
                    <TableRow key={i}>
                      <TableCell>{report.branch}</TableCell>
                      <TableCell>{report.bh}</TableCell>
                      <TableCell>{report.date}</TableCell>
                      <TableCell>
                        <Badge variant={report.status === "Approved" ? "default" : "outline"}>
                          {report.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>BHR Performance Overview</CardTitle>
                <Badge variant="outline">Current Month</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bhrData.map((bhr) => (
                  <div key={bhr.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium">{bhr.id} - {bhr.name}</p>
                      <p className="text-sm text-slate-500">{bhr.completed}/{bhr.total} branches</p>
                    </div>
                    <Progress value={bhr.progress} className="h-2" />
                  </div>
                ))}
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View All BHRs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branch Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {branchCategories.map((cat) => (
                  <div key={cat.category} className="flex justify-between items-center">
                    <p className="text-sm font-medium">{cat.category}</p>
                    <p className="text-sm text-slate-500">{cat.count} branches</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Unmapped Branches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {unmappedBranches.map((branch) => (
                  <div key={branch.id} className="p-2 border rounded-md">
                    <p className="font-medium">{branch.name}</p>
                    <p className="text-xs text-slate-500">Category: {branch.category}</p>
                  </div>
                ))}
                <Button variant="secondary" size="sm" className="w-full mt-3">
                  Assign Branches
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ZHDashboard;
