import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import ChatInterface from "@/components/practice/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useWebsocket } from "@/services/websocketService";
import { WebSocketErrorMessages } from "@/types/websocket";
import { capitalizeEvaluationTitle } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  EvaluationMessage,
  QuestionMessage,
  SessionCompleteMessage,
  WebSocketMessage,
} from "@/types/websocket";

interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface SessionDetails {
  categoryId: string;
  productId: string;
  testConfigId: string;
  timestamp: string;
}

interface EvaluationResults {
  complete: string;
  additional?: string;
}

const ChatSessionPage = () => {
  // Navigation and context
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();

  // UI state
  const [isAttemptingToLeave, setIsAttemptingToLeave] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasAnsweredFirst, setHasAnsweredFirst] = useState(false);

  // Session state
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Chat state
  const [conversationHistory, setConversationHistory] = useState<ConversationPair[]>([]);
  const [currentCustomerQuestion, setCurrentCustomerQuestion] = useState("");
  const [salespersonInput, setSalespersonInput] = useState("");
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResults | null>(null);

  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Core utility functions
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  }, []);

  // Initialize WebSocket hook first to avoid circular dependency
  const {
    isConnected,
    connect,
    send,
    sendAnswer,
    startSession,
    endSession,
    cleanup
  } = useWebsocket({
    debug: true,
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onClose: (event) => {
      setSessionLoading(false);
      // Only show connection closed error if it wasn't a clean close and we haven't answered
      if (!event.wasClean && !hasAnswered) {
        setSessionError(WebSocketErrorMessages.CONNECTION_CLOSED);
        toast.error(WebSocketErrorMessages.CONNECTION_CLOSED);
      }
    }
  });

  const cleanupSession = useCallback(() => {
    localStorage.removeItem("currentSession");
    setConversationHistory([]);
    setCurrentCustomerQuestion("");
    setSalespersonInput("");
    setSessionLoading(false);
    setHasAnswered(false);
    setHasAnsweredFirst(false);
    setEvaluationResults(null);
    setSessionError(null);
    cleanup();
  }, [cleanup]);

  // Message handling
  const handleMessage = useCallback(
    (data: WebSocketMessage) => {
      switch (data.type) {
        case "question":
        case "next_question":
          // Only process next question if first answer was sent or it's the very first question
          if (hasAnsweredFirst || conversationHistory.length === 0) {
            setCurrentCustomerQuestion(data.content || "");
            setConversationHistory((prev) => [
              ...prev,
              { visitor_text: data.content || "", salesperson_text: "" },
            ]);
            setSessionLoading(false);
            scrollToBottom();
          }
          break;

        case "evaluation": {
          setConversationHistory((prev) => {
            const updated = [...prev];
            if (updated.length > 0) {
              updated[updated.length - 1].salesperson_text = salespersonInput;
            }
            return updated;
          });
          setSalespersonInput("");

          if (data.next_question && hasAnsweredFirst) {
            setTimeout(() => {
              setCurrentCustomerQuestion(data.next_question || "");
              setConversationHistory((prev) => [
                ...prev,
                { visitor_text: data.next_question || "", salesperson_text: "" },
              ]);
              setSessionLoading(false);
              scrollToBottom();
            }, 500);
          } else {
            setSessionLoading(false);
          }
          break;
        }

        case "session_complete": {
          const msg = data as SessionCompleteMessage;
          console.log('[Chat] Session complete response received:', data);
          
          setEvaluationResults({
            complete: msg.complete_evaluation,
            additional: msg.additional_criteria_evaluation,
          });

          cleanupSession();
          setHasAnswered(true);
          
          setTimeout(() => {
            navigate("/practice", { 
              state: { sessionCompleted: true }
            });
          }, 2000);
          break;
        }

        case "end_session": {
          console.log('[Chat] Session ended successfully');
          cleanupSession();
          setHasAnswered(true);
          navigate("/practice", {
            state: { sessionCompleted: true }
          });
          break;
        }

        case "error": {
          const errorMessage = data.error || "An error occurred during the session";
          setSessionError(errorMessage);
          setSessionLoading(false);
          toast.error(errorMessage);
          break;
        }
      }
    },
    [salespersonInput, navigate, scrollToBottom, cleanupSession]
  );

  // Configure WebSocket message handler
  useEffect(() => {
    if (handleMessage) {
      // Update the WebSocket message handler through the hook's config
      connect("/ws/chat", token, {
        debug: true,
        onMessage: handleMessage
      });
    }
  }, [handleMessage, token, connect]);

  // WebSocket connection and session management
  useEffect(() => {
    if (!sessionDetails || !token) return;

    const initSession = async () => {
      try {
        await connect("/ws/chat", token);
        console.log("[Chat] Starting session with:", {
          productId: sessionDetails.productId,
          testConfigId: sessionDetails.testConfigId,
        });

        setSessionLoading(true);
        const started = await startSession(
          sessionDetails.productId,
          sessionDetails.testConfigId
        );
        
        if (!started) {
          setSessionLoading(false);
          toast.error(WebSocketErrorMessages.CONNECTION_FAILED);
        }
      } catch (error) {
        console.error("[Chat] Connection error:", error);
        setSessionLoading(false);
        toast.error(WebSocketErrorMessages.CONNECTION_FAILED);
      }
    };

    initSession();
    return () => cleanup();
  }, [sessionDetails, token, connect, startSession, cleanup]);

  // Load session details on mount
  useEffect(() => {
    const savedSession = localStorage.getItem("currentSession");
    if (!savedSession) {
      navigate("/session/setup");
      return;
    }

    try {
      const details = JSON.parse(savedSession) as SessionDetails;
      setSessionDetails(details);
    } catch (error) {
      console.error("Error loading session details:", error);
      navigate("/session/setup");
    }
  }, [navigate]);

  // Sending messages and session control
  const sendSalespersonAnswer = useCallback(async () => {
    if (
      sessionLoading ||
      !salespersonInput.trim() ||
      !currentCustomerQuestion ||
      !isConnected ||
      !sessionDetails
    ) {
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      recognition?.stop();
    }

    setSessionLoading(true);
    setSessionError(null);

    const historyPayload = conversationHistory.map((pair, index) => ({
      visitor_text: pair.visitor_text,
      salesperson_text:
        index === conversationHistory.length - 1
          ? salespersonInput
          : pair.salesperson_text,
    }));

    setConversationHistory((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].salesperson_text = salespersonInput;
      }
      return updated;
    });

    const messageToSend = salespersonInput.trim();
    setSalespersonInput("");
    scrollToBottom();

    // Set hasAnsweredFirst to true when sending first answer
    if (!hasAnsweredFirst) {
      setHasAnsweredFirst(true);
      // Initialize the conversation with the first question if it hasn't been added yet
      if (conversationHistory.length === 0 && currentCustomerQuestion) {
        setConversationHistory([
          { visitor_text: currentCustomerQuestion, salesperson_text: salespersonInput.trim() }
        ]);
      }
    }

    try {
      const success = await sendAnswer({
        product_id: sessionDetails.productId,
        test_configuration_id: sessionDetails.testConfigId,
        last_question: currentCustomerQuestion,
        answer: messageToSend,
        history: historyPayload,
      });

      if (!success) {
        setSessionLoading(false);
        toast.error(WebSocketErrorMessages.SEND_FAILED);
      }
    } catch (error) {
      setSessionLoading(false);
      toast.error(WebSocketErrorMessages.SEND_FAILED);
    }
  }, [
    sessionLoading,
    salespersonInput,
    currentCustomerQuestion,
    isConnected,
    isRecording,
    recognition,
    conversationHistory,
    sessionDetails,
    scrollToBottom,
    sendAnswer,
  ]);

  const handleEndSession = useCallback(async () => {
    if (!sessionDetails || !isConnected || sessionLoading) return;

    setSessionLoading(true);

    const finalHistory = [...conversationHistory];
    const hasUnsentResponse = salespersonInput.trim().length > 0;

    if (hasUnsentResponse && finalHistory.length > 0) {
      finalHistory[finalHistory.length - 1].salesperson_text =
        salespersonInput.trim();
    }

    try {
      const success = await endSession({
        product_id: sessionDetails.productId,
        test_configuration_id: sessionDetails.testConfigId,
        last_question: currentCustomerQuestion,
        answer: hasUnsentResponse ? salespersonInput.trim() : "",
        history: finalHistory,
      });

      if (!success) {
        setSessionLoading(false);
        toast.error(WebSocketErrorMessages.SEND_FAILED);
      }
      // Don't navigate here - wait for the end_session message response
      
    } catch (error) {
      setSessionLoading(false);
      toast.error(WebSocketErrorMessages.SEND_FAILED);
    }
  }, [
    sessionDetails,
    isConnected,
    sessionLoading,
    conversationHistory,
    currentCustomerQuestion,
    salespersonInput,
    endSession,
  ]);

  // Handle voice input
  const handleVoiceInput = useCallback(() => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isRecording) {
      recognition?.stop();
      setRecognition(null);
      setIsRecording(false);
      return;
    }

    const newRecognition = new (window as any).webkitSpeechRecognition();
    newRecognition.continuous = true;
    newRecognition.interimResults = true;

    newRecognition.onstart = () => setIsRecording(true);
    newRecognition.onend = () => {
      setIsRecording(false);
      setRecognition(null);
    };

    newRecognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join(" ");

      setSalespersonInput(transcript);
    };

    newRecognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsRecording(false);
      setRecognition(null);
      toast.error("Voice input error. Please try again.");
    };

    setRecognition(newRecognition);
    newRecognition.start();
  }, [isRecording, recognition]);

  // Clean up recognition on unmount
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
        setIsRecording(false);
        setRecognition(null);
      }
    };
  }, [recognition]);

  return (
    <div className="fixed inset-0 bg-background min-h-screen flex flex-col">
      <AnimatePresence>
        {isAttemptingToLeave && !hasAnswered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-semibold mb-4">
                Assessment in Progress
              </h2>
              <p className="text-muted-foreground mb-6">
                You cannot leave during an active assessment. Please complete or
                end the session first.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsAttemptingToLeave(false)}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Continue Assessment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Interface */}
      <ChatInterface
        ref={scrollRef}
        sessionLoading={sessionLoading}
        conversationHistory={conversationHistory}
        salespersonInput={salespersonInput}
        onSalespersonInputChange={setSalespersonInput}
        onSendResponse={sendSalespersonAnswer}
        onEndSession={handleEndSession}
        canEndSession={!sessionLoading && hasAnsweredFirst}
        isRecording={isRecording}
        onVoiceInput={handleVoiceInput}
        className="flex-1"
      />

      {/* Session Complete Dialog */}
      <Dialog
        open={!!evaluationResults}
        onOpenChange={() => setEvaluationResults(null)}
      >
        <DialogContent className="max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Session Complete</h2>
          {evaluationResults && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {capitalizeEvaluationTitle("Complete Evaluation")}
                </h3>
                <p className="whitespace-pre-wrap">
                  {evaluationResults.complete}
                </p>
              </div>

              {evaluationResults.additional && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {capitalizeEvaluationTitle("Additional Criteria")}
                    </h3>
                    <p className="whitespace-pre-wrap">
                      {evaluationResults.additional}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatSessionPage;
