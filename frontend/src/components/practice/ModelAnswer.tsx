
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

interface ModelAnswerProps {
  modelAnswer: string;
}

const ModelAnswer = ({ modelAnswer }: ModelAnswerProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow animate-scale-in">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-green-100 dark:bg-green-900/30 p-1 rounded-full">
            <Check className="h-5 w-5 text-green-500" />
          </div>
          <CardTitle className="text-lg">Model Answer</CardTitle>
        </div>
        
        <div className="border-l-2 border-green-500 pl-4">
          <p className="text-muted-foreground">{modelAnswer}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelAnswer;
