import { ConversationPair } from "@/types/practice";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mic, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "@/styles/chat-animations.css";
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  memo,
  forwardRef,
  ForwardRefRenderFunction,
} from "react";
import { cn } from "@/lib/utils";
import { Message } from "@/components/chat/Message";
import { LoadingIndicator } from "@/components/chat/LoadingIndicator";
import { TimerDisplay } from "@/components/chat/TimerDisplay";
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
import { useChatInput } from "@/hooks/chat/useChatInput";

const ASSESSMENT_DURATION = 300; // 5 minutes in seconds

interface ChatInterfaceProps {
  conversationHistory: ConversationPair[];
  sessionLoading: boolean;
  salespersonInput: string;
  onSalespersonInputChange: (value: string) => void;
  onSendResponse: () => void;
  onEndSession: () => Promise<void>;
  canEndSession: boolean;
  className?: string;
}

const ChatInterface: ForwardRefRenderFunction<
  HTMLDivElement,
  ChatInterfaceProps
> = (
  {
    conversationHistory,
    sessionLoading,
    salespersonInput,
    onSalespersonInputChange,
    onSendResponse,
    onEndSession,
    canEndSession,
    className,
  },
  ref
) => {
  const [isEndAlertOpen, setIsEndAlertOpen] = useState(false);
  const [isEndingAssessment, setIsEndingAssessment] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Enhanced scroll to bottom function
  const scrollToBottom = useCallback(
    (smooth = true) => {
      if (!messageContainerRef.current || !autoScroll) return;

      const { scrollHeight, clientHeight } = messageContainerRef.current;
      const targetScroll = scrollHeight - clientHeight;

      messageContainerRef.current.scrollTo({
        top: targetScroll,
        behavior: smooth ? "smooth" : "auto",
      });
    },
    [autoScroll]
  );

  // Handle scroll events to determine if auto-scroll should be enabled
  const handleScroll = useCallback(() => {
    if (messageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messageContainerRef.current;
      // Only enable auto-scroll when very close to bottom (within 20px)
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 20;
      if (isAtBottom !== autoScroll) {
        setAutoScroll(isAtBottom);
        console.log(
          "[ChatInterface] Auto-scroll:",
          isAtBottom ? "enabled" : "disabled"
        );
      }
    }
  }, [autoScroll]);

  // Use custom hooks
  const {
    textareaRef,
    handleInput,
    handleKeyDown,
    handleVoiceInput,
    handleCursorChange,
    cleanup,
    isVoiceActive,
  } = useChatInput({
    onSalespersonInputChange,
    onSendResponse,
    salespersonInput,
    onVoiceStateChange: () => {}, // Optional prop
  });
  // Scroll to bottom when conversation updates
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, scrollToBottom]);


  // Add scroll event listener and cleanup voice recognition
  useEffect(() => {
    const container = messageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => {
        container.removeEventListener("scroll", handleScroll);
        cleanup();
      };
    }
    return cleanup;
  }, [handleScroll, cleanup]);

  // Force scroll to bottom when sending a message
  useEffect(() => {
    if (sessionLoading) {
      setAutoScroll(true);
      scrollToBottom(false);
    }
  }, [sessionLoading, scrollToBottom]);

  // Initialize timer and session control
  const { timeLeft, formattedTime, isActive, startTimer, stopTimer } =
    useAssessmentTimer({
      duration: ASSESSMENT_DURATION,
      onTimeEnd: () => {
        console.log("[ChatInterface] Assessment time up - auto ending session");
        setIsEndAlertOpen(true);
        // Auto end session after 3 seconds when time is up
        setTimeout(async () => {
          setIsEndingAssessment(true);
          setIsEndAlertOpen(false);
          stopTimer();
          try {
            await onEndSession();
          } catch (error) {
            console.error("[ChatInterface] Error ending assessment:", error);
            setIsEndingAssessment(false);
          }
        }, 3000);
      },
    });

  // Start timer when first question is received (when conversation history gets its first item)
  useEffect(() => {
    if (!isActive && conversationHistory.length === 1) {
      console.log(
        "[ChatInterface] First question received - Starting assessment timer"
      );
      startTimer();
    }
  }, [isActive, startTimer, conversationHistory.length]);

  // Stop timer when session ends
  useEffect(() => {
    if (!canEndSession) {
      stopTimer();
    }
  }, [canEndSession, stopTimer]);

  const handleEndConfirm = useCallback(() => {
    if (isEndingAssessment) {
      console.log("[ChatInterface] Already ending assessment, ignoring click");
      return;
    }

    console.log("[ChatInterface] Starting end assessment process...");
    setIsEndingAssessment(true);
    setIsEndAlertOpen(false);
    stopTimer();

    // Use Promise to handle the async operation
    Promise.resolve(onEndSession())
      .then(() => {
        console.log("[ChatInterface] Assessment ended successfully");
        // Force reload the practice page
        window.location.href = "/Practice";
      })
      .catch((error) => {
        console.error("[ChatInterface] Error ending assessment:", error);
        setIsEndingAssessment(false);
        setIsEndAlertOpen(false); // Close the dialog on error
      });
  }, [onEndSession, stopTimer, isEndingAssessment]);

  const handleButtonClick = useCallback((buttonType: 'confirm' | 'send') => {
    if (buttonType === 'confirm') {
      handleEndConfirm();
    } else if (buttonType === 'send') {
      onSendResponse();
    }
  }, [handleEndConfirm, onSendResponse]);
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
    <div ref={ref} className={cn("flex flex-col w-full h-full", className)}>
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
            overflowY: "auto",
            overscrollBehavior: "auto",
            height: "100%",
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
              <div className="relative">
                <button
                  onClick={handleVoiceInput}
                  disabled={sessionLoading}
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 relative z-10",
                    isVoiceActive
                      ? "text-blue-500 bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  )}
                  style={{
                    animation: isVoiceActive
                      ? "glowPulse 2s ease-in-out infinite"
                      : "none",
                  }}
                >
                  <Mic
                    className={cn(
                      "h-5 w-5 transition-transform duration-300",
                      isVoiceActive &&
                        "text-blue-500 animate-[micScale_1.5s_ease-in-out_infinite]"
                    )}
                  />
                  {isVoiceActive && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-blue-200/50 animate-[pulseRing_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                      <span className="absolute inset-0 rounded-full bg-blue-200/30 animate-[pulseRing_2s_cubic-bezier(0.4,0,0.6,1)_infinite_400ms]" />
                      <span className="absolute inset-0 rounded-full bg-blue-200/20 animate-[pulseRing_2s_cubic-bezier(0.4,0,0.6,1)_infinite_800ms]" />
                      <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-sm" />
                    </>
                  )}
                </button>
              </div>
              <Button
                size="icon"
                onClick={() => handleButtonClick('send')}
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
              onClick={() => handleButtonClick('confirm')}
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

ChatInterface.displayName = "ChatInterface";

export default memo(forwardRef(ChatInterface));
