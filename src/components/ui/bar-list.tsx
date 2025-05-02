
import React from "react";
import { cn } from "@/lib/utils";

interface BarListProps {
  data: {
    name: string;
    value: number;
    label?: string;
    href?: string;
    color?: string;
  }[];
  valueFormatter?: (value: number) => string;
  className?: string;
}

export const BarList = ({
  data,
  valueFormatter = (value) => value.toString(),
  className,
}: BarListProps) => {
  // Find the maximum value to calculate relative widths
  const maxValue = Math.max(...data.map((item) => item.value), 0);

  return (
    <div className={cn("space-y-3", className)}>
      {data.map((item, index) => {
        // Calculate relative width as a percentage (minimum 8% to always show some bar)
        const relativeWidth = maxValue > 0 
          ? Math.max(8, (item.value / maxValue) * 100)
          : 8;
        
        return (
          <div key={index} className="flex flex-col space-y-1.5">
            <div className="flex justify-between items-center">
              <div className="text-sm font-medium">{item.name}</div>
              <div className="text-sm text-muted-foreground">
                {item.label || valueFormatter(item.value)}
              </div>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${relativeWidth}%`,
                  backgroundColor: item.color || "var(--color-blue-500)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
