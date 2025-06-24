import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IndividualRating {
  score: number;
  max: number;
}

interface IndividualEvaluation {
  evaluation: string;
  reference_answer?: string;
  rating: {
    question_relevance: IndividualRating;
    technical_accuracy: IndividualRating;
    sales_effectiveness: IndividualRating;
    total: IndividualRating;
  };
}

interface ExchangeEvaluationsProps {
  evaluations: IndividualEvaluation[];
  formatEvaluationData: (value: any) => React.ReactNode;
}

const ExchangeEvaluations: React.FC<ExchangeEvaluationsProps> = ({
  evaluations,
  formatEvaluationData,
}) => {
  if (!evaluations?.length) return null;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <Clock className="h-5 w-5 mr-2 text-blue-500" />
          EXCHANGE EVALUATIONS
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {evaluations.map((ind_eval: IndividualEvaluation, index) => (
            <div key={index} className="p-4 border-b last:border-b-0">
              <div className="mb-3">
                <h4 className="font-medium text-sm mb-2">
                  Exchange {index + 1}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ind_eval.rating || {}).map(
                    ([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded"
                      >
                        {key.replace(/_/g, " ")}: {value.score}/
                        {value.max}
                      </span>
                    )
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600">
                {formatEvaluationData(ind_eval.evaluation)}
              </p>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ExchangeEvaluations;
