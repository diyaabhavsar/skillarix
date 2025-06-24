import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface EvaluationContentProps {
  title: string;
  content: React.ReactNode;
}

const EvaluationContent: React.FC<EvaluationContentProps> = ({ title, content }) => (
  <div className="space-y-2">
    <h3 className="text-sm font-medium text-slate-900">{title}</h3>
    <div className="text-sm text-slate-600">{content}</div>
  </div>
);

interface CompleteEvaluationProps {
  completeEvaluation: Record<string, any>;
  formatEvaluationValue: (value: any) => React.ReactNode;
}

const CompleteEvaluation: React.FC<CompleteEvaluationProps> = ({
  completeEvaluation,
  formatEvaluationValue,
}) => {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
          COMPLETE EVALUATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {Object.entries(completeEvaluation || {}).map(([key, value]) => (
            <EvaluationContent
              key={key}
              title={key}
              content={formatEvaluationValue(value)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompleteEvaluation;
