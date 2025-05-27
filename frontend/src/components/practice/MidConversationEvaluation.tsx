
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

export type MidEvaluationData = {
  conversationDirection: {
    score: number;
    maxScore: number;
    details: string[];
  };
  informationConsistency: {
    score: number;
    maxScore: number;
    details: string[];
  };
  customerEngagement: {
    score: number;
    maxScore: number;
    details: string[];
  };
  totalScore: number;
  maxScore: number;
  recommendations: string[];
};

interface MidConversationEvaluationProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: MidEvaluationData;
}

const MidConversationEvaluation = ({ 
  isOpen, 
  onClose, 
  evaluation 
}: MidConversationEvaluationProps) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={() => onClose()}>
      <AlertDialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
        <AlertDialogTitle className="text-xl font-bold border-b pb-4">
          Mid-Conversation Evaluation
        </AlertDialogTitle>
        
        <div className="mt-4 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Overall Score</h3>
              <span className="text-sm font-medium">
                {evaluation.totalScore}/{evaluation.maxScore} points
              </span>
            </div>
            <Progress 
              value={(evaluation.totalScore / evaluation.maxScore) * 100} 
              className="h-2" 
            />
          </div>
          
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
            <ScoreCard 
              title="Conversation Direction"
              score={evaluation.conversationDirection.score}
              maxScore={evaluation.conversationDirection.maxScore}
              details={evaluation.conversationDirection.details}
            />
            
            <ScoreCard 
              title="Information Consistency"
              score={evaluation.informationConsistency.score}
              maxScore={evaluation.informationConsistency.maxScore}
              details={evaluation.informationConsistency.details}
            />
            
            <ScoreCard 
              title="Customer Engagement" 
              score={evaluation.customerEngagement.score}
              maxScore={evaluation.customerEngagement.maxScore}
              details={evaluation.customerEngagement.details}
            />
          </div>
          
          <div className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold flex items-center mb-3">
                  <InfoIcon className="h-5 w-5 mr-2 text-primary" />
                  Recommendations
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  {evaluation.recommendations.map((rec, index) => (
                    <li key={index} className="text-muted-foreground">{rec}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <AlertDialogFooter className="mt-6">
          <Button onClick={onClose}>Continue Practice</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const ScoreCard = ({ 
  title, 
  score, 
  maxScore, 
  details 
}: { 
  title: string; 
  score: number; 
  maxScore: number;
  details: string[];
}) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium">{title}</h4>
          <span className="font-medium text-sm">
            {score}/{maxScore}
          </span>
        </div>
        <Progress 
          value={(score / maxScore) * 100} 
          className={`h-2 mb-4 ${getScoreColor(score, maxScore)}`}
        />
        <div className="space-y-2 mt-3">
          {details.map((detail, i) => (
            <div key={i} className="text-sm text-muted-foreground">
              • {detail}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MidConversationEvaluation;
