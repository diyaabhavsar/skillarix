import { Product, TestConfiguration, ConversationPair } from "@/types/practice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatInterfaceProps {
  products: Product[];
  testConfigurations: TestConfiguration[];
  selectedProductId: string;
  selectedTestConfigId: string;
  conversationHistory: ConversationPair[];
  sessionLoading: boolean;
  salespersonInput: string;
  isRecording: boolean;
  onSalespersonInputChange: (value: string) => void;
  onVoiceInput: () => void;
  onSendResponse: () => void;
  canEndSession: boolean;
  onEndSession: () => void;
}

const ChatInterface = ({
  products,
  testConfigurations,
  selectedProductId,
  selectedTestConfigId,
  conversationHistory,
  sessionLoading,
  salespersonInput,
  isRecording,
  onSalespersonInputChange,
  onVoiceInput,
  onSendResponse,
  canEndSession,
  onEndSession,
}: ChatInterfaceProps) => {
  const [isEndAlertOpen, setIsEndAlertOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Improved scroll handler with smooth behavior
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Scroll on new messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, sessionLoading, scrollToBottom]);

  // Initial scroll without animation
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  const handleEndConfirm = () => {
    setIsEndAlertOpen(false);
    onEndSession();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-background overflow-hidden">
      {/* Chat messages area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout" initial={false}>
              {conversationHistory.map((pair, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Customer Message */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 max-w-[90%] md:max-w-[85%]">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-blue-600 px-2">
                          Customer
                        </span>
                        <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
                          {pair.visitor_text}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salesperson Message */}
                  {pair.salesperson_text && (
                    <div className="flex items-start justify-end gap-2">
                      <div className="flex-1 max-w-[90%] md:max-w-[85%]">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-medium text-green-600 px-2">
                            You
                          </span>
                          <div className="bg-green-50 rounded-2xl rounded-tr-none px-6 py-4 shadow-sm">
                            {pair.salesperson_text}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {sessionLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="bg-muted px-4 py-2 rounded-full">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Fixed input area */}
      <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative flex items-center gap-2">
            <Textarea
              value={salespersonInput}
              onChange={(e) => onSalespersonInputChange(e.target.value)}
              placeholder="Type your response..."
              disabled={sessionLoading}
              className="min-h-[80px] pr-24 resize-none text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (salespersonInput.trim()) onSendResponse();
                }
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={onVoiceInput}
                className={cn(
                  "h-8 w-8 rounded-full transition-colors",
                  isRecording
                    ? "bg-red-100 text-red-600 hover:bg-red-200"
                    : "hover:bg-slate-100"
                )}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                onClick={onSendResponse}
                disabled={sessionLoading || !salespersonInput.trim()}
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              >
                {sessionLoading ? (
                  <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsEndAlertOpen(true)}
              disabled={!canEndSession}
              className="text-sm"
            >
              End Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* End session confirmation dialog */}
      <AlertDialog open={isEndAlertOpen} onOpenChange={setIsEndAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this assessment? You will receive your
              final evaluation results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndConfirm}>
              End Assessment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatInterface;
