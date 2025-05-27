
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type MidEvaluation = {
  id: string;
  conversationDirection: number;
  informationConsistency: number;
  customerEngagement: number;
  recommendations: string[];
};

interface MidSessionEvaluationProps {
  evaluations: MidEvaluation[];
}

const MidSessionEvaluation = ({ evaluations }: MidSessionEvaluationProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mid-Conversation Evaluations</CardTitle>
        <CardDescription>
          Feedback provided during your practice session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {evaluations.map((evaluation, index) => (
          <div key={evaluation.id} className="space-y-6">
            <h3 className="text-lg font-medium">Evaluation #{index + 1}</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Conversation Direction</span>
                  <span>{evaluation.conversationDirection}/3</span>
                </div>
                <Progress value={(evaluation.conversationDirection / 3) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Information Consistency</span>
                  <span>{evaluation.informationConsistency}/3</span>
                </div>
                <Progress value={(evaluation.informationConsistency / 3) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Customer Engagement</span>
                  <span>{evaluation.customerEngagement}/4</span>
                </div>
                <Progress value={(evaluation.customerEngagement / 4) * 100} />
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Recommendations:</h4>
              <ul className="space-y-2">
                {evaluation.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-primary text-xs">{i + 1}</span>
                    </span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default MidSessionEvaluation;
