import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MidEvaluationsProps {
  evaluations: string[];
  formatAIGeneratedText: (text: string) => React.ReactNode;
}

const MidEvaluations: React.FC<MidEvaluationsProps> = ({
  evaluations,
  formatAIGeneratedText,
}) => {
  if (!evaluations?.length) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <Clock className="h-5 w-5 mr-2 text-orange-500" />
          MID EVALUATIONS
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[200px]">
          <div className="p-4">
            {evaluations.map((midEval, idx) => (
              <div key={idx} className="mb-4 last:mb-0">
                <h3 className="font-medium text-sm text-slate-900 mb-1">
                  Mid Evaluation {idx + 1}
                </h3>
                <p className="text-sm text-slate-600">
                  {formatAIGeneratedText(midEval)}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default MidEvaluations;
