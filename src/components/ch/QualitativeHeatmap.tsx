
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

// Define the types of qualitative data
type QualitativeRating = "very_poor" | "poor" | "neutral" | "good" | "excellent" | null;
type QualitativeMetric = "culture_branch" | "line_manager_behavior" | "branch_hygiene" | "overall_discipline";

interface HeatmapData {
  metric: QualitativeMetric;
  very_poor: number;
  poor: number;
  neutral: number;
  good: number;
  excellent: number;
  total: number;
}

interface QualitativeHeatmapProps {
  title?: string;
  dateRange?: { from: Date; to: Date } | null;
  branchCategory?: string | null;
}

const metricLabels: Record<QualitativeMetric, string> = {
  culture_branch: "Branch Culture",
  line_manager_behavior: "Line Manager Behavior",
  branch_hygiene: "Branch Hygiene",
  overall_discipline: "Overall Discipline"
};

const QualitativeHeatmap = ({ 
  title = "Qualitative Assessment Heatmap", 
  dateRange = null,
  branchCategory = null 
}: QualitativeHeatmapProps) => {
  const [data, setData] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Color scale for the heatmap
  const getColorForPercentage = (percentage: number): string => {
    if (percentage === 0) return "#F1F0FB"; // Very light for no data
    if (percentage < 0.1) return "#E5DEFF"; // Very light purple
    if (percentage < 0.2) return "#D3BCFA"; // Light purple
    if (percentage < 0.3) return "#B197FC"; // Purple
    if (percentage < 0.4) return "#9B87F5"; // Medium purple
    if (percentage < 0.5) return "#8B5CF6"; // Bright purple
    if (percentage < 0.6) return "#7C3AED"; // Dark purple
    if (percentage < 0.7) return "#6D28D9"; // Very dark purple
    if (percentage < 0.8) return "#5B21B6"; // Ultra dark purple
    if (percentage < 0.9) return "#4C1D95"; // Deep purple
    return "#2E1065"; // Extremely deep purple
  };

  useEffect(() => {
    const fetchQualitativeData = async () => {
      setLoading(true);
      setError(null);

      try {
        let query = supabase.from('branch_visits')
          .select(`
            culture_branch,
            line_manager_behavior,
            branch_hygiene,
            overall_discipline
          `);

        // Add date filtering if provided
        if (dateRange) {
          query = query
            .gte('visit_date', dateRange.from.toISOString().split('T')[0])
            .lte('visit_date', dateRange.to.toISOString().split('T')[0]);
        }

        // Add branch category filtering if provided
        if (branchCategory) {
          query = query.eq('branch_category', branchCategory.toLowerCase());
        }

        const { data, error } = await query;

        if (error) throw error;

        // Process the data for the heatmap
        const metrics: QualitativeMetric[] = [
          "culture_branch",
          "line_manager_behavior",
          "branch_hygiene",
          "overall_discipline"
        ];

        // Initialize the counts for each metric and rating
        const processedData: HeatmapData[] = metrics.map(metric => ({
          metric,
          very_poor: 0,
          poor: 0,
          neutral: 0,
          good: 0,
          excellent: 0,
          total: 0
        }));

        // Count the occurrences of each rating for each metric
        data?.forEach(visit => {
          metrics.forEach(metric => {
            const rating = visit[metric as keyof typeof visit] as QualitativeRating;
            if (rating) {
              const metricData = processedData.find(d => d.metric === metric);
              if (metricData) {
                metricData[rating as keyof typeof metricData] += 1;
                metricData.total += 1;
              }
            }
          });
        });

        setData(processedData);
      } catch (error) {
        console.error("Error fetching qualitative data:", error);
        setError("Failed to load qualitative data");
      } finally {
        setLoading(false);
      }
    };

    fetchQualitativeData();
  }, [dateRange, branchCategory]);

  if (loading) {
    return (
      <Card className="w-full h-80">
        <CardContent className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="text-center text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  // Format the rating labels for better display
  const formatRatingLabel = (rating: string): string => {
    return rating.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // All possible ratings in order
  const ratingColumns = ["very_poor", "poor", "neutral", "good", "excellent"];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-gray-600">Metric</th>
                {ratingColumns.map(rating => (
                  <th key={rating} className="p-2 text-center font-medium text-gray-600">
                    {formatRatingLabel(rating)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-t border-gray-200">
                  <td className="p-3 font-medium">
                    {metricLabels[row.metric]}
                  </td>
                  {ratingColumns.map(rating => {
                    const count = row[rating as keyof HeatmapData] as number;
                    const percentage = row.total > 0 ? count / row.total : 0;
                    const backgroundColor = getColorForPercentage(percentage);
                    
                    return (
                      <td 
                        key={`${row.metric}-${rating}`} 
                        className="p-3 text-center" 
                        style={{ backgroundColor }}
                      >
                        <div className="font-medium text-sm">{count}</div>
                        <div className="text-xs text-gray-500">
                          {row.total > 0 ? `${Math.round(percentage * 100)}%` : '0%'}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Color Scale</div>
          <div className="flex h-4">
            {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9].map((value) => (
              <div 
                key={value} 
                className="flex-1"
                style={{ backgroundColor: getColorForPercentage(value) }} 
              />
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QualitativeHeatmap;
