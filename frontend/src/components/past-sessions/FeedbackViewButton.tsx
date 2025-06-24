import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ConversationEvaluation } from "@/types/conversations";

interface FeedbackViewButtonProps {
  sessionId: string;
  disabled?: boolean;
  className?: string;
  session: ConversationEvaluation;
}

export const FeedbackViewButton = ({ 
  sessionId, 
  disabled = false, 
  className,
  session
}: FeedbackViewButtonProps) => {
  const navigate = useNavigate();

  const handleViewFeedback = () => {
    // If we have the session data, store it before navigation
    if (session) {
      sessionStorage.setItem(
        `session-feedback-${sessionId}`,
        JSON.stringify(session)
      );
    }
    navigate(`/feedback/${sessionId}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled}
      onClick={handleViewFeedback}
    >
      View Feedback
    </Button>
  );
};