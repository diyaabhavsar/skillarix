
import { Check } from "lucide-react";
import { Message } from "@/types/session";

interface ConversationMessagesProps {
  messages: Message[];
  isEvaluating: boolean;
}

const ConversationMessages = ({ messages, isEvaluating }: ConversationMessagesProps) => {
  return (
    <div className="space-y-6">
      {messages.map((message, i) => (
        <div key={i} className="space-y-2">
          {message.role === "system" ? (
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-sm">
                C
              </div>
              <div className="flex-1">
                <div className="bg-secondary/50 p-3 rounded-lg text-foreground">
                  {message.content}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
                Y
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-primary/10 p-3 rounded-lg ml-auto text-foreground">
                  {message.content}
                </div>
                
                {message.evaluation && (
                  <div className="bg-muted p-3 rounded-lg space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Response Evaluation</h4>
                      <span className="text-sm font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                        Score: {message.evaluation.score}/10
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{message.evaluation.feedback}</p>
                    
                    <div className="border-l-2 border-accent pl-3 mt-2">
                      <h5 className="text-xs font-medium text-accent-foreground flex items-center">
                        <Check className="h-3 w-3 mr-1" /> Model Answer
                      </h5>
                      <p className="text-xs text-muted-foreground mt-1">
                        {message.evaluation.idealAnswer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      
      {isEvaluating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-subtle"></div>
          Evaluating your response...
        </div>
      )}
    </div>
  );
};

export default ConversationMessages;
