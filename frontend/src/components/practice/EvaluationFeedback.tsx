
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";

interface EvaluationFeedbackProps {
  score: number;
  feedback: string;
}

const EvaluationFeedback = ({ score, feedback }: EvaluationFeedbackProps) => {
  const [animate, setAnimate] = useState(false);
  
  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timer);
  }, [score]);
  
  let scoreColor = "text-red-500";
  let bgColor = "bg-red-50 dark:bg-red-900/20";
  
  if (score >= 9) {
    scoreColor = "text-green-500";
    bgColor = "bg-green-50 dark:bg-green-900/20";
  } else if (score >= 7) {
    scoreColor = "text-yellow-500";
    bgColor = "bg-yellow-50 dark:bg-yellow-900/20";
  }
  
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow animate-fade-in overflow-hidden">
      <CardContent className="pt-6">
        <CardTitle className="text-lg mb-4">Evaluation Feedback</CardTitle>
        
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-medium">Your Score</span>
          <div className={`rounded-full ${bgColor} px-3 py-1`}>
            <span className={`text-lg font-bold ${scoreColor} ${animate ? 'scale-110 transition-transform' : ''}`}>
              {score}/10
            </span>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-medium mb-2">Feedback</h4>
          <div className="border-l-2 border-primary pl-4">
            <p className="text-muted-foreground">{feedback}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationFeedback;
