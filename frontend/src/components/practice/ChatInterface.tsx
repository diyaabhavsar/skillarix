import { Product, TestConfiguration, ConversationPair } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import React, { useRef, useEffect, useCallback, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/components/chat/Message";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { TimerDisplay } from "@/components/chat/TimerDisplay";
import { useVoiceInput } from "@/hooks/chat/useVoiceInput";
import { useTextInput } from "@/hooks/chat/useTextInput";
import { useAssessmentTimer } from "@/hooks/chat/useAssessmentTimer";
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

const ASSESSMENT_DURATION = 300; // 5 minutes in seconds

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Use custom hooks
  const {
    textareaRef,
    handleInput,
    handleKeyDown,
    animateTextareaScroll,
  } = useTextInput({
    onSalespersonInputChange,
    onSendResponse,
    salespersonInput,
  });

  const { handleVoiceInput } = useVoiceInput({
    onSalespersonInputChange,
    onVoiceInput,
    cursorPosition,
    currentText: salespersonInput,
  });

  // Handle timer end
  const handleTimeEnd = useCallback(() => {
    setIsEndAlertOpen(true);
    setTimeout(() => {
      handleEndConfirm();
    }, 3000); // Auto end after 3 seconds
  }, []);

  // Initialize timer
  const {
    timeLeft,
    formattedTime,
    isActive,
    startTimer,
    stopTimer,
  } = useAssessmentTimer({
    duration: ASSESSMENT_DURATION,
    onTimeEnd: handleTimeEnd,
  });

  // Start timer when conversation starts
  useEffect(() => {
    if (conversationHistory.length > 0 && !isActive) {
      startTimer();
    }
  }, [conversationHistory.length, isActive, startTimer]);

  // Stop timer when session ends
  useEffect(() => {
    if (!canEndSession) {
      stopTimer();
    }
  }, [canEndSession, stopTimer]);

  // Handle cursor position
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, [textareaRef]);

  // Handle end session
  const handleEndConfirm = useCallback(() => {
    setIsEndAlertOpen(false);
    stopTimer();
    onEndSession();
  }, [onEndSession, stopTimer]);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "end",
    });
  }, []);

  // Scroll effects
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, sessionLoading, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(false);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] bg-background overflow-hidden">
      {/* Timer Display */}
      <div className="absolute top-4 right-4 z-50">
        <TimerDisplay
          time={formattedTime}
          isActive={isActive}
          timeLeft={timeLeft}
          totalTime={ASSESSMENT_DURATION}
        />
      </div>

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
                  <Message text={pair.visitor_text} isCustomer={true} />
                  {pair.salesperson_text && (
                    <Message text={pair.salesperson_text} isCustomer={false} />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {sessionLoading && <LoadingIndicator />}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input area */}
      <div className="flex-none border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative flex items-center gap-2">
            <Textarea
              ref={textareaRef}
              value={salespersonInput}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onSelect={handleCursorChange}
              onMouseUp={handleCursorChange}
              onFocus={handleCursorChange}
              placeholder="Type your response..."
              disabled={sessionLoading}
              className="min-h-[80px] pr-24 resize-none text-base custom-scrollbar"
              style={{
                overflowY: 'auto',
                maxHeight: '200px',
              }}
            />
            <div className="absolute right-2 bottom-2 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceInput}
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

      {/* End session dialog */}
      <AlertDialog
        open={isEndAlertOpen}
        onOpenChange={(open) => {
          // Only allow closing if timer hasn't ended
          if (timeLeft > 0) {
            setIsEndAlertOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {timeLeft === 0 ? "Time's Up!" : "End Assessment?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {timeLeft === 0
                ? "Your assessment time has ended. Your responses will be submitted automatically."
                : "Are you sure you want to end this assessment? You will receive your final evaluation results."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {timeLeft > 0 && <AlertDialogCancel>Cancel</AlertDialogCancel>}
            <AlertDialogAction 
              onClick={handleEndConfirm}
              className="bg-primary hover:bg-primary/90"
            >
              {timeLeft === 0 ? "Submit Assessment" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default memo(ChatInterface);
