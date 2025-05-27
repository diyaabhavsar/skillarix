import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { AlertDialogTitle } from "@/components/ui/alert-dialog";
import { StarIcon, ThumbsUpIcon, ThumbsDownIcon, InfoIcon } from "lucide-react";
import TabbedEvaluationDisplay from "@/components/TabbedEvaluationDisplay";
import { mockMidEvaluationData, mockEndEvaluationData } from "@/data/evaluationData";

const mockAdditionalEvaluationData = {
  type: "additional",
  totalScore: 0,
  maxScore: 0,
  categories: [],
  feedback: "No additional evaluation available.",
  recommendations: [],
};

export type EndEvaluationData = {
  overallProgress: {
    score: number;
    maxScore: number;
  };
  salesStrategy: {
    score: number;
    maxScore: number;
  };
  customerJourney: {
    score: number;
    maxScore: number;
  };
  technicalAccuracy: {
    score: number;
    maxScore: number;
  };
  totalScore: number;
  maxScore: number;
  keySuccessMoments: string[];
  missedOpportunities: string[];
  patternInsights: string[];
  recommendations: string[];
};

interface EndConversationEvaluationProps {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  evaluation: EndEvaluationData;
}

const EndConversationEvaluation = ({
  isOpen,
  onClose,
  onNewSession,
  evaluation
}: EndConversationEvaluationProps) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const exchanges = [
    {
      question: "What makes this refrigerator different from others?",
      answer: "This Danby refrigerator is apartment-sized but spacious...",
      modelAnswer: "A lot of people struggle with finding a fridge that fits...",
      evaluation: {
        type: "individual",
        totalScore: 10,
        maxScore: 10,
        categories: [],
        feedback: "Good explanation...",
        recommendations: [],
      },
    },
    // ...more exchanges
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto" side="right">
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-xl">Evaluation Complete</SheetTitle>
          <SheetDescription>
            Here's a comprehensive review of your performance
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-6 pb-20">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Overall Score</h3>
              <span className="text-sm font-medium">
                {evaluation.totalScore}/{evaluation.maxScore} points
              </span>
            </div>
            <Progress
              value={(evaluation.totalScore / evaluation.maxScore) * 100}
              className={`h-2 ${getScoreColor(evaluation.totalScore, evaluation.maxScore)}`}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="font-semibold">Score Breakdown</h3>
            <div className="space-y-3">
              <ScoreRow 
                name="Overall Progress" 
                score={evaluation.overallProgress.score} 
                maxScore={evaluation.overallProgress.maxScore} 
              />
              <ScoreRow 
                name="Sales Strategy" 
                score={evaluation.salesStrategy.score} 
                maxScore={evaluation.salesStrategy.maxScore} 
              />
              <ScoreRow 
                name="Customer Journey" 
                score={evaluation.customerJourney.score} 
                maxScore={evaluation.customerJourney.maxScore} 
              />
              <ScoreRow 
                name="Technical Accuracy" 
                score={evaluation.technicalAccuracy.score} 
                maxScore={evaluation.technicalAccuracy.maxScore} 
              />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            <InsightCard 
              title="Key Success Moments"
              items={evaluation.keySuccessMoments}
              icon={<ThumbsUpIcon className="h-5 w-5 text-green-500" />}
            />
            
            <InsightCard 
              title="Missed Opportunities"
              items={evaluation.missedOpportunities}
              icon={<ThumbsDownIcon className="h-5 w-5 text-yellow-500" />}
            />
          </div>
          
          <div className="space-y-4">
            <InsightCard 
              title="Pattern Insights" 
              items={evaluation.patternInsights}
              icon={<StarIcon className="h-5 w-5 text-primary" />}
            />
              
            <InsightCard 
              title="Future Recommendations" 
              items={evaluation.recommendations}
              icon={<InfoIcon className="h-5 w-5 text-primary" />}
            />
          </div>
        </div>
        
        <TabbedEvaluationDisplay
          exchanges={exchanges}
          midEvaluation={mockMidEvaluationData}
          completeEvaluation={mockEndEvaluationData}
          additionalEvaluation={mockAdditionalEvaluationData}
        />
        
        <SheetFooter className="fixed bottom-0 right-0 left-0 p-6 bg-background border-t flex flex-row gap-4 justify-end">
          <Button variant="outline" onClick={onNewSession}>New Session</Button>
          <Button onClick={onClose}>Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

const ScoreRow = ({ 
  name, 
  score, 
  maxScore 
}: { 
  name: string; 
  score: number; 
  maxScore: number;
}) => {
  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm">{name}</span>
        <span className="text-sm font-medium">{score}/{maxScore}</span>
      </div>
      <Progress 
        value={(score / maxScore) * 100} 
        className={`h-1.5 ${getScoreColor(score, maxScore)}`} 
      />
    </div>
  );
};

const InsightCard = ({ 
  title, 
  items, 
  icon 
}: { 
  title: string; 
  items: string[];
  icon: React.ReactNode;
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="text-sm text-muted-foreground flex gap-2">
              <span className="text-primary">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default EndConversationEvaluation;
