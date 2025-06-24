import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CriteriaValue {
  score?: number;
  max?: number;
  [key: string]: any;
}

type AdditionalCriteriaValue = CriteriaValue | string | null;

interface AdditionalCriteriaProps {
  criteriaEvaluation: Record<string, AdditionalCriteriaValue>;
  formatAIGeneratedText: (text: string) => React.ReactNode;
}

const AdditionalCriteria: React.FC<AdditionalCriteriaProps> = ({
  criteriaEvaluation,
  formatAIGeneratedText,
}) => {
  if (!criteriaEvaluation) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
          ADDITIONAL CRITERIA
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[575px]">
          <div className="p-4 space-y-6">
            {Object.entries(criteriaEvaluation).map(([key, value]: [string, AdditionalCriteriaValue]) => (
              <div
                key={key}
                className="group rounded-xl border bg-white shadow-sm transition-all hover:shadow-md"
              >
                <div className="border-b bg-gradient-to-r from-slate-50 to-white px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-purple-50 p-2">
                        <AlertCircle className="h-5 w-5 text-purple-500" />
                      </div>
                      <h3 className="font-semibold text-slate-900">
                        {key
                          .split("_")
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </h3>
                    </div>
                    {value &&
                      typeof value === "object" &&
                      "score" in value && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm text-slate-500">Score:</div>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium
                            ${
                              Number(value.score) >= 7
                                ? "bg-green-50 text-green-700"
                                : Number(value.score) >= 4
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {value.score}
                            <span className="text-slate-400">/</span>
                            <span className="text-slate-600">{value.max || 10}</span>
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <div className="divide-y divide-dashed divide-slate-100">
                  {value && typeof value === "object" ? (
                    <div className="space-y-4 p-4">
                      {Object.entries(value).map(([subKey, subValue]) => {
                        if (subKey === "score" || subKey === "max") return null;
                        return (
                          <div key={subKey} className="rounded-lg bg-slate-50/50 p-4">
                            <h4 className="mb-2 font-medium text-slate-900">
                              {subKey.replace(/_/g, " ")}
                            </h4>
                            <div className="prose prose-sm max-w-none text-slate-600">
                              {formatAIGeneratedText(String(subValue))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="prose prose-sm max-w-none text-slate-600">
                        {formatAIGeneratedText(String(value))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AdditionalCriteria;
