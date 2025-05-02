
import React from "react";
import { User } from "lucide-react";

const EmptyBHRState = () => {
  return (
    <div className="py-12 text-center text-slate-500 bg-white rounded-lg shadow-sm animate-fade-in">
      <div className="flex justify-center mb-3">
        <User className="h-12 w-12 text-slate-300" />
      </div>
      <h3 className="text-lg font-medium mb-1">No BHRs found</h3>
      <p>No Branch Head Representatives match your current filters.</p>
    </div>
  );
};

export default EmptyBHRState;
