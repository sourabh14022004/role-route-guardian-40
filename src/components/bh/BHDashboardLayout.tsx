
import React, { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LayoutDashboard, Plus, List, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BHDashboardLayout = () => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/bh/dashboard" },
    { icon: Plus, label: "New Visit", path: "/bh/new-visit" },
    { icon: List, label: "My Visits", path: "/bh/my-visits" },
    { icon: Calendar, label: "Calendar", path: "/bh/calendar" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside 
        className={cn(
          "h-screen bg-white shadow-md transition-all duration-300 flex flex-col", 
          expanded ? "w-60" : "w-16"
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="flex items-center justify-center h-16 border-b">
          {expanded ? (
            <h2 className="text-xl font-bold">HDFC App</h2>
          ) : (
            <h2 className="text-xl font-bold">H</h2>
          )}
        </div>
        
        <nav className="flex-1 mt-6">
          <ul className="px-2 space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <NavLink 
                  to={item.path}
                  className={({ isActive }) => cn(
                    "flex items-center rounded-md transition-all duration-200 hover:bg-slate-100",
                    isActive ? "bg-primary/10 text-primary" : "text-slate-700",
                    expanded ? "py-2 px-4" : "py-2 justify-center"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {expanded && <span className="ml-3">{item.label}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => {
              supabase.auth.signOut();
            }}
          >
            {expanded ? "Logout" : ""}
          </Button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default BHDashboardLayout;
