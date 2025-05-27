
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight } from "lucide-react";

interface MessageInputProps {
  response: string;
  setResponse: (response: string) => void;
  handleSubmit: () => void;
  isEvaluating: boolean;
}

const MessageInput = ({ response, setResponse, handleSubmit, isEvaluating }: MessageInputProps) => {
  return (
    <div className="relative">
      <Textarea
        value={response}
        onChange={(e) => setResponse(e.target.value)}
        placeholder="Type your response to the customer..."
        className="min-h-[120px] resize-none pr-12"
        disabled={isEvaluating}
      />
      <Button
        size="icon"
        className="absolute right-4 bottom-4"
        onClick={handleSubmit}
        disabled={isEvaluating || !response.trim()}
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MessageInput;
