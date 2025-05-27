
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

type FinalEvaluation = {
  overallProgress: number;
  salesStrategy: number;
  customerJourney: number;
  technicalAccuracy: number;
  successMoments: string[];
  missedOpportunities: string[];
  patterns: string[];
  recommendations: string[];
};

interface FinalAssessmentProps {
  evaluation: FinalEvaluation;
}

const FinalAssessment = ({ evaluation }: FinalAssessmentProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Final Assessment</CardTitle>
        <CardDescription>
          Overall evaluation of your sales practice session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Score Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Overall Progress</span>
                  <span>{evaluation.overallProgress}/3</span>
                </div>
                <Progress value={(evaluation.overallProgress / 3) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sales Strategy</span>
                  <span>{evaluation.salesStrategy}/3</span>
                </div>
                <Progress value={(evaluation.salesStrategy / 3) * 100} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Customer Journey</span>
                  <span>{evaluation.customerJourney}/2</span>
                </div>
                <Progress value={(evaluation.customerJourney / 2) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Technical Accuracy</span>
                  <span>{evaluation.technicalAccuracy}/2</span>
                </div>
                <Progress value={(evaluation.technicalAccuracy / 2) * 100} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Key Successful Moments:</h4>
            <ul className="space-y-2">
              {evaluation.successMoments.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-green-600" />
                  </span>
                  <span className="text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Missed Opportunities:</h4>
            <ul className="space-y-2">
              {evaluation.missedOpportunities.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-amber-600 text-xs">
                    !
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-3">Pattern Insights:</h4>
          <ul className="space-y-2">
            {evaluation.patterns.map((pattern, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-primary text-xs">{i + 1}</span>
                </span>
                {pattern}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-3">Recommendations for Improvement:</h4>
          <ul className="space-y-2">
            {evaluation.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5 text-blue-600 text-xs">
                  {i + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalAssessment;
