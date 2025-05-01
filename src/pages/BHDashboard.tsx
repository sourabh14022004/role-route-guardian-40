
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BHDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Sample data for the dashboard
  const stats = [
    { title: "Assigned Branches", value: "12" },
    { title: "Branches Visited", value: "9" },
    { title: "Pending Visits", value: "3" },
    { title: "Completion Rate", value: "75", suffix: "%" },
  ];

  const branchCategories = [
    { name: "Platinum", progress: 100 },
    { name: "Diamond", progress: 80 },
    { name: "Gold", progress: 60 },
    { name: "Silver", progress: 40 },
    { name: "Bronze", progress: 20 },
  ];

  const visitMetrics = [
    { name: "HR Connect Sessions", value: "8/9" },
    { name: "Avg. Participation", value: "85%" },
    { name: "Employee Coverage", value: "76%" },
    { name: "New Employee Coverage", value: "92%" },
  ];

  return (
    <div className="p-8">
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome, {profile?.full_name || "Branch Head"}</h1>
        <p className="text-slate-600 mt-2">Here's an overview of your branch visits</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="text-sm text-slate-500">{stat.title}</div>
              <div className="text-3xl font-bold mt-2">{stat.value}{stat.suffix}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Branch visit progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Branch Visit Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-500">Current Month</span>
                <span className="font-medium">Overall Progress</span>
              </div>
              <Progress value={75} className="h-2" />
              <div className="flex justify-end mt-1">
                <span className="text-sm font-medium">75%</span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-4">Branch Categories</h4>
              <div className="space-y-4">
                {branchCategories.map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-sm font-medium">{category.progress}%</span>
                    </div>
                    <Progress value={category.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visit Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {visitMetrics.map((metric) => (
                <div key={metric.name} className="border rounded-lg p-4">
                  <div className="text-sm text-slate-500">{metric.name}</div>
                  <div className="text-2xl font-bold mt-2">{metric.value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BHDashboard;
