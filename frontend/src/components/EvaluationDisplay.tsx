
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type ScoreCategory = {
  name: string;
  score: number;
  maxScore: number;
  details?: string[];
};

type EvaluationDisplayProps = {
  type: "individual" | "mid" | "complete";
  totalScore: number;
  maxScore: number;
  categories: ScoreCategory[];
  feedback: string;
  recommendations?: string[];
  successMoments?: string[];
  missedOpportunities?: string[];
};

const EvaluationDisplay = ({
  type,
  totalScore,
  maxScore,
  categories,
  feedback,
  recommendations,
  successMoments,
  missedOpportunities,
}: EvaluationDisplayProps) => {
  const scorePercentage = (totalScore / maxScore) * 100;
  
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className={cn(
        "pb-2",
        type === "individual" ? "bg-secondary/30" : 
        type === "mid" ? "bg-primary/10" : "gradient-purple"
      )}>
        <CardTitle className={cn(
          "text-lg flex justify-between items-center",
          type === "complete" && "text-white"
        )}>
          <span>
            {type === "individual" ? "Response Evaluation" : 
             type === "mid" ? "Mid-Conversation Evaluation" : 
             "Complete Evaluation"}
          </span>
          <span className={cn(
            "text-base font-medium",
            type !== "complete" && getScoreColor(totalScore, maxScore)
          )}>
            {totalScore}/{maxScore} points
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Score</span>
            <span className="font-medium">{Math.round(scorePercentage)}%</span>
          </div>
          <Progress 
            value={scorePercentage} 
            className={cn("h-2", getProgressColor(totalScore, maxScore))} 
          />
        </div>

        <div className="space-y-3">
          {categories.map((category, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{category.name}</span>
                <span className={cn(
                  "font-medium", 
                  getScoreColor(category.score, category.maxScore)
                )}>
                  {category.score}/{category.maxScore}
                </span>
              </div>
              {category.details && category.details.length > 0 && (
                <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
                  {category.details.map((detail, i) => (
                    <li key={i}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <h4 className="font-medium text-sm">Feedback</h4>
          <p className="text-sm text-muted-foreground">{feedback}</p>
        </div>

        {recommendations && recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Recommendations</h4>
            <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {type === "complete" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {successMoments && successMoments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-500">Key Success Moments</h4>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                  {successMoments.map((moment, i) => (
                    <li key={i}>{moment}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {missedOpportunities && missedOpportunities.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-yellow-500">Missed Opportunities</h4>
                <ul className="text-sm text-muted-foreground space-y-1 pl-4 list-disc">
                  {missedOpportunities.map((opp, i) => (
                    <li key={i}>{opp}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvaluationDisplay;
