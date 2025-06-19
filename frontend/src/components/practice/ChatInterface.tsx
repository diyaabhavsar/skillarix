import { ConversationPair } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback, useState, memo, forwardRef, ForwardRefRenderFunction } from "react";
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
  conversationHistory: ConversationPair[];
  sessionLoading: boolean;
  salespersonInput: string;
  isRecording: boolean;
  onSalespersonInputChange: (value: string) => void;
  onVoiceInput: () => void;
  onSendResponse: () => void;
  onEndSession: () => void;
  canEndSession: boolean;
  className?: string;
}

const ChatInterface: ForwardRefRenderFunction<HTMLDivElement, ChatInterfaceProps> = ({
  conversationHistory,
  sessionLoading,
  salespersonInput,
  isRecording,
  onSalespersonInputChange,
  onVoiceInput,
  onSendResponse,
  onEndSession,
  canEndSession,
  className
}, ref) => {
  const [isEndAlertOpen, setIsEndAlertOpen] = useState(false);
  const [isEndingAssessment, setIsEndingAssessment] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [cursorPosition, setCursorPosition] = useState<number>(0);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback((smooth = true) => {
    if (lastMessageRef.current && autoScroll) {
      lastMessageRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, [autoScroll]);

  // Handle scroll events to determine if auto-scroll should be enabled
  const handleScroll = useCallback(() => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100; // Within 100px of bottom
      setAutoScroll(isAtBottom);
    }
  }, []);

  // Use custom hooks
  const { textareaRef, handleInput, handleKeyDown } = useTextInput({
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

  // Timer hook
  const { timeLeft, formattedTime, isActive, startTimer, stopTimer } = useAssessmentTimer({
    duration: ASSESSMENT_DURATION,
    onTimeEnd: () => {
      setIsEndAlertOpen(true);
      setTimeout(async () => {
        console.log("[ChatInterface] Auto-ending session due to time up");
        setIsEndingAssessment(true);
        setIsEndAlertOpen(false);
        stopTimer();
        await onEndSession();
      }, 3000);
    },
  });

  // Scroll to bottom when conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, scrollToBottom]);

  // Add scroll event listener
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Force scroll to bottom when sending a message
  useEffect(() => {
    if (sessionLoading) {
      setAutoScroll(true);
      scrollToBottom(false);
    }
  }, [sessionLoading, scrollToBottom]);

  // Initialize timer and session control
  const { timeLeft: timerTimeLeft, formattedTime: timerFormattedTime, isActive: timerIsActive, startTimer: timerStart, stopTimer: timerStop } =
    useAssessmentTimer({
      duration: ASSESSMENT_DURATION,
      onTimeEnd: () => {
        setIsEndAlertOpen(true);
        // Auto end session after 3 seconds when time is up
        setTimeout(async () => {
          console.log("[ChatInterface] Auto-ending session due to time up");
          setIsEndingAssessment(true);
          setIsEndAlertOpen(false);
          timerStop();
          try {
            await onEndSession();
          } catch (error) {
            console.error("[ChatInterface] Error ending assessment:", error);
            setIsEndingAssessment(false);
          }
        }, 3000);
      },
    });

  // Start timer when conversation starts
  useEffect(() => {
    if (conversationHistory.length > 0 && !timerIsActive) {
      timerStart();
    }
  }, [conversationHistory.length, timerIsActive, timerStart]);

  // Stop timer when session ends
  useEffect(() => {
    if (!canEndSession) {
      timerStop();
    }
  }, [canEndSession, timerStop]);

  // Handle cursor position
  const handleCursorChange = useCallback(() => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  }, [textareaRef]);

  
  const handleEndConfirm = useCallback(async () => {
    if (isEndingAssessment) return; // Prevent multiple submissions
    
    console.log("[ChatInterface] Starting end assessment process...");
    setIsEndingAssessment(true);
    setIsEndAlertOpen(false);
    timerStop();
    
    try {
      await onEndSession();
      console.log("[ChatInterface] Assessment ended successfully");
      // Don't reset isEndingAssessment here as we want to keep the UI in loading state
      // until the navigation happens from the parent component
    } catch (error) {
      console.error("[ChatInterface] Error ending assessment:", error);
      setIsEndingAssessment(false);
      setIsEndAlertOpen(false); // Close the dialog on error
    }
  }, [onEndSession, timerStop, isEndingAssessment]);

  // Handle dialog close
  const handleDialogClose = useCallback(
    (open: boolean) => {
      if (!open && !isEndingAssessment) {
        // Only allow closing if not in the process of ending
        console.log("[ChatInterface] Cancelling end assessment dialog");
        setIsEndAlertOpen(false);
      }
    },
    [isEndingAssessment]
  );

  // Handle dialog open
  const handleEndDialogOpen = useCallback(() => {
    console.log("[End Assessment] Opening confirmation dialog...");
    setIsEndAlertOpen(true);
  }, []);

  return (
    <div className={cn("flex flex-col w-full h-full", className)}>
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
        <div 
          ref={messageContainerRef}
          className="h-full overflow-y-auto px-4 py-4 custom-scrollbar"
          style={{ 
            scrollBehavior: "smooth",
            overscrollBehavior: "contain"
          }}
        >
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
            <div ref={lastMessageRef} className="h-1" /> {/* Scroll anchor */}
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
                overflowY: "auto",
                maxHeight: "200px",
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
                onClick={() => {
                  if (isEndAlertOpen) {
                    handleEndConfirm();
                  } else {
                    onSendResponse();
                  }
                }}
                disabled={
                  sessionLoading ||
                  !salespersonInput.trim() ||
                  isEndingAssessment
                }
                className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
              >
                {sessionLoading || isEndingAssessment ? (
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
              onClick={handleEndDialogOpen}
              disabled={!canEndSession || isEndAlertOpen}
              className="text-sm"
            >
              End Assessment
            </Button>
          </div>
        </div>
      </div>

      {/* End session dialog */}
      <AlertDialog open={isEndAlertOpen} onOpenChange={handleDialogClose}>
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
            {!isEndingAssessment && timeLeft > 0 && (
              <AlertDialogCancel
                onClick={() => {
                  console.log("[ChatInterface] Cancelling end assessment");
                  setIsEndAlertOpen(false);
                }}
              >
                Cancel
              </AlertDialogCancel>
            )}
            <AlertDialogAction
              
              disabled={isEndingAssessment}
              className={cn(
                "bg-primary hover:bg-primary/90",
                isEndingAssessment && "opacity-50 cursor-not-allowed"
              )}
            >
              {isEndingAssessment ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : timeLeft === 0 ? (
                "Submit Assessment"
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

ChatInterface.displayName = 'ChatInterface';

export default memo(forwardRef(ChatInterface));
