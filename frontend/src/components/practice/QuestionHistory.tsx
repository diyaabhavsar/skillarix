
import { Card } from "@/components/ui/card";
import { Question } from "@/types/practice";
import { Check, CircleDot } from "lucide-react";

interface QuestionHistoryProps {
  questions: Question[];
  currentIndex: number;
  onQuestionSelect: (index: number) => void;
}

const QuestionHistory = ({ questions, currentIndex, onQuestionSelect }: QuestionHistoryProps) => {
  return (
    <div className="w-64 h-full border-r p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4">Questions</h3>
      
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => onQuestionSelect(index)}
            className={`w-full text-left p-3 text-sm rounded-md flex items-start gap-2 transition-colors ${
              index === currentIndex
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted"
            }`}
          >
            {question.status === "evaluated" ? (
              <Check className="h-4 w-4 mt-0.5 shrink-0" />
            ) : index === currentIndex ? (
              <CircleDot className="h-4 w-4 mt-0.5 shrink-0" />
            ) : (
              <div className="h-4 w-4 rounded-full border mt-0.5 shrink-0" />
            )}
            <span className="truncate">Question {index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionHistory;
