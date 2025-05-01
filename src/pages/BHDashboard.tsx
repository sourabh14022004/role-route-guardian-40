
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const BHDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getProfile();
  }, [user]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome, {profile?.full_name || "Branch Head"}</h1>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assigned Branches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Branches Visited</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">9</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Branch Visit Progress */}
      <h2 className="text-xl font-semibold mb-4">Branch Visit Progress</h2>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">Current Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-4">Branch Categories</h3>
              <div className="space-y-4">
                {[
                  { name: "Platinum", value: 100 },
                  { name: "Diamond", value: 80 },
                  { name: "Gold", value: 60 },
                  { name: "Silver", value: 40 },
                  { name: "Bronze", value: 20 },
                ].map((category) => (
                  <div key={category.name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">{category.name}</span>
                      <span className="text-sm">{category.value}%</span>
                    </div>
                    <Progress value={category.value} className="h-1.5" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-base font-medium mb-4">Visit Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">HR Connect Sessions</p>
                  <p className="text-lg font-medium">8/9</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Participation</p>
                  <p className="text-lg font-medium">85%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employee Coverage</p>
                  <p className="text-lg font-medium">76%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New Employee Coverage</p>
                  <p className="text-lg font-medium">92%</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BHDashboard;
