import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";

interface OverallPerformanceProps {
  completeRating: any;
  formatRatingKey: (key: string) => string;
  renderRating: (rating: any) => React.ReactNode;
}

const OverallPerformance: React.FC<OverallPerformanceProps> = ({
  completeRating,
  formatRatingKey,
  renderRating,
}) => {
  if (!completeRating) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          OVERALL PERFORMANCE
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {Object.entries(completeRating)
            .filter(([key]) => key !== "total")
            .map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">
                    {formatRatingKey(key)}
                  </span>
                  <div className="w-1/2">{renderRating(value)}</div>
                </div>
              </div>
            ))}
          {completeRating.total && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total Score</span>
                <div className="w-1/2">
                  {renderRating(completeRating.total)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallPerformance;
