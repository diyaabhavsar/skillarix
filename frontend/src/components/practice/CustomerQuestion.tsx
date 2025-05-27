
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface CustomerQuestionProps {
  question: string;
}

const CustomerQuestion = ({ question }: CustomerQuestionProps) => {
  return (
    <div className="animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm shadow-md transition-transform hover:scale-105">
          C
        </div>
        <div className="bg-muted/50 p-4 rounded-lg rounded-tl-none shadow-sm hover:shadow transition-shadow">
          <CardTitle className="text-lg mb-2">Customer Question</CardTitle>
          <p className="text-foreground">{question}</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerQuestion;
