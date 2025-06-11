import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { websocketService } from "@/services/websocketService";
import PastSessionsTable from "@/components/past-sessions/PastSessionsTable";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Mic, MicOff } from "lucide-react"; // Add this import
import { useConversationHistory } from "@/hooks/useConversationHistory";
import SessionsPagination from "@/components/past-sessions/SessionsPagination";
import PracticeHeader from "@/components/practice/PracticeHeader";
import SessionSetupForm from "@/components/practice/SessionSetupForm";
import ChatInterface from "@/components/practice/ChatInterface";
import { useNavigate } from "react-router-dom"; // Update import
import { ErrorBoundary } from "@/components/ErrorBoundary";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

interface TestConfiguration {
  id: string;
  name: string;
  product_id: string;
  visitorPersona: { [key: string]: any };
  additionalCriteria: { [key: string]: boolean };
  created_at: string;
}

interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface EvaluationResults {
  complete: string;
  additional?: string;
}

interface WebSocketMessage {
  type: "question" | "evaluation" | "session_complete" | "error";
  content?: string;
  evaluation?: string;
  next_question?: string;
  complete_evaluation?: string;
  additional_criteria_evaluation?: string;
}

const Practice = () => {
  const navigate = useNavigate(); // Add hook
  const { token } = useAuth();
  const {
    categories,
    products,
    testConfigurations,
    selectedCategoryId,
    selectedProductId,
    selectedTestConfigId,
    isLoading: isSelectionLoading,
    error: selectionError,
    setSelectedCategoryId,
    setSelectedProductId,
    setSelectedTestConfigId,
    isSelectionValid,
  } = usePracticeSession();

  // WebSocket related states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    ConversationPair[]
  >([]);
  const [salespersonInput, setSalespersonInput] = useState("");
  const [currentCustomerQuestion, setCurrentCustomerQuestion] = useState("");
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [evaluationResults, setEvaluationResults] =
    useState<EvaluationResults | null>(null);
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isEnding, setIsEnding] = useState(false);

  // Add ref for scroll area
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Add new function to handle scrolling
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100); // Small delay to ensure DOM update
  }, []);

  // Update effect to scroll on conversation changes
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, scrollToBottom]);

  // Add effect to scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversationHistory]);
  console.log({ conversationHistory });
  // Pagination states and effects
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Set to match backend limit

  // Add pagination data state
  const [paginationData, setPaginationData] = useState({
    skip: 0,
    limit: itemsPerPage,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });

  const { conversations, fetchConversations, loading, error } =
    useConversationHistory();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!isSessionActive || !token) {
      websocketService.close();
      return;
    }

    const ws = websocketService.connect("/ws/chat", token, {
      debug: true,
      onOpen: () => {
        if (selectedProductId && selectedTestConfigId) {
          websocketService.startSession(
            selectedProductId,
            selectedTestConfigId
          );
          setSessionLoading(true);
          setSessionError(null);
        } else {
          setSessionError(
            "Product and Test Configuration must be selected to start."
          );
          setIsSessionActive(false);
          websocketService.close();
        }
      },
      onMessage: (data) => {
        console.log("Received message:", data);
        switch (data.type) {
          case "question":
            setCurrentCustomerQuestion(data.content || "");
            setConversationHistory((prev) => [
              ...prev,
              { visitor_text: data.content || "", salesperson_text: "" },
            ]);
            setSessionLoading(false);
            break;

          case "evaluation":
            handleSalespersonResponseEvaluation(data);
            break;

          case "session_complete":
            handleSessionComplete(data);
            break;

          case "error":
            handleError(data);
            break;
        }
      },
      onError: () => {
        setSessionError("WebSocket connection error.");
        setIsSessionActive(false);
        setSessionLoading(false);
      },
      onClose: () => {
        if (isSessionActive) {
          setSessionError("Session ended unexpectedly.");
        }
        setIsSessionActive(false);
        setSessionLoading(false);
      },
    });

    setWebsocket(ws);

    return () => websocketService.close();
  }, [isSessionActive, selectedProductId, selectedTestConfigId, token]);

  const handleSalespersonResponseEvaluation = (data: WebSocketMessage) => {
    setConversationHistory((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].salesperson_text = salespersonInput;
      }
      return updated;
    });
    setSalespersonInput("");
    setSessionLoading(false);

    // Add next question if available
    if (data.next_question) {
      setCurrentCustomerQuestion(data.next_question);
      setConversationHistory((prev) => [
        ...prev,
        { visitor_text: data.next_question, salesperson_text: "" },
      ]);
      scrollToBottom();
    }
  };

  const sendSalespersonAnswer = () => {
    if (
      !websocketService.isConnected() ||
      sessionLoading ||
      !salespersonInput.trim() ||
      !currentCustomerQuestion
    ) {
      return;
    }

    // Stop recording if active
    if (isRecording && recognition) {
      recognition.stop();
      setIsRecording(false);
      setRecognition(null);
    }

    // Clear input immediately
    setSalespersonInput("");

    // Update conversation history and clear input immediately
    setConversationHistory((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].salesperson_text = salespersonInput;
      }
      return updated;
    });
    scrollToBottom(); // Scroll to bottom after updating

    setSessionLoading(true);
    setSessionError(null);

    const historyPayload = conversationHistory.map((pair, index) => ({
      visitor_text: pair.visitor_text,
      salesperson_text:
        index === conversationHistory.length - 1
          ? salespersonInput
          : pair.salesperson_text,
    }));

    websocketService.sendAnswer({
      product_id: selectedProductId,
      test_configuration_id: selectedTestConfigId,
      last_question: currentCustomerQuestion,
      answer: salespersonInput,
      history: historyPayload,
    });
  };

  const cleanupSession = () => {
    setIsEnding(false); // Reset ending state
    setIsSessionActive(false);
    setConversationHistory([]);
    setCurrentCustomerQuestion("");
    setSalespersonInput("");
    setSessionLoading(false);
    setIsSetupOpen(false); // Close sidebar
  };

  const endSession = async () => {
    try {
      setIsEnding(true); // Set ending state to true
      if (!websocket) {
        throw new Error("WebSocket connection not found");
      }

      if (websocket.readyState !== WebSocket.OPEN) {
        throw new Error("WebSocket connection is not open");
      }

      if (!selectedProductId || !selectedTestConfigId) {
        throw new Error("Missing product or test configuration ID");
      }

      const finalHistory = [...conversationHistory];

      if (salespersonInput.trim() && finalHistory.length > 0) {
        // Update the last response in history
        finalHistory[finalHistory.length - 1].salesperson_text =
          salespersonInput;
      }

      const payload = {
        type: "end_session",
        product_id: selectedProductId,
        test_configuration_id: selectedTestConfigId,
        last_question: currentCustomerQuestion,
        answer: salespersonInput.trim(),
        history: finalHistory,
      };

      websocket.send(JSON.stringify(payload));
      setSessionLoading(true);
    } catch (error) {
      console.error("Error ending session:", error);
      toast.error(
        `Failed to end session: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      cleanupSession();
    }
  };

  const startSession = () => {
    if (!isSelectionValid) {
      toast.error("Please select a product and a test configuration to start.");
      return;
    }
    setIsSessionActive(true);
    setConversationHistory([]);
    setCurrentCustomerQuestion("");
    setEvaluationResults(null);
    setSessionError(null);
  };

  const isStartButtonDisabled =
    isSelectionLoading || !isSelectionValid || isSessionActive;

  const handleEvaluation = (data: WebSocketMessage) => {
    // First update the conversation history with the salesperson's answer
    setConversationHistory((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].salesperson_text = salespersonInput;
      }
      return updated;
    });

    // Clear the input and wait briefly before showing next question
    setSalespersonInput("");
    setTimeout(() => {
      if (data.next_question) {
        setCurrentCustomerQuestion(data.next_question);
        setConversationHistory((prev) => [
          ...prev,
          { visitor_text: data.next_question, salesperson_text: "" },
        ]);
      }
      setSessionLoading(false);
    }, 500); // Small delay to show the answer first
  };

  const handleSessionComplete = (data: WebSocketMessage) => {
    console.log("Session Complete Response:", {
      evaluation: data.complete_evaluation?.substring(0, 100) + "...",
      additionalCriteria:
        data.additional_criteria_evaluation?.substring(0, 100) + "...",
      type: data.type,
    });
    setEvaluationResults({
      complete: data.complete_evaluation || "",
      additional: data.additional_criteria_evaluation,
    });
    cleanupSession();
  };

  const handleError = (data: WebSocketMessage) => {
    console.error("WebSocket Error from server:", data.content);
    setSessionError(data.content || "An error occurred during the session.");
    setIsSessionActive(false);
    setSessionLoading(false);
  };

  // Updated voice input handler
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    if (isRecording) {
      // Stop recording
      recognition?.stop();
      setRecognition(null);
      setIsRecording(false);
      return;
    }

    // Start new recording
    const newRecognition = new (window as any).webkitSpeechRecognition();
    newRecognition.continuous = true;
    newRecognition.interimResults = true;

    newRecognition.onstart = () => {
      setIsRecording(true);
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

    newRecognition.onend = () => {
      setIsRecording(false);
      setRecognition(null);
    };

    setRecognition(newRecognition);
    newRecognition.start();
  };

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
  console.log({ conversations });
  // Update how we pass the conversations data
  const processedSessions = React.useMemo(() => {
    if (!conversations?.data) return [];
    return conversations.data.map((session) => ({
      ...session,
      category_id: session.category_id || "",
      test_name: session.test_name || "",
      prod_name: session.prod_name || "",
      cat_name: session.cat_name || "",
      evaluation_data: {
        ...session.evaluation_data,
        complete_rating: {
          overall_progress: { score: 0, max: 0 },
          sales_strategy: { score: 0, max: 0 },
          customer_journey: { score: 0, max: 0 },
          technical_accuracy: { score: 0, max: 0 },
          total: session.evaluation_data.complete_rating?.total || {
            score: 0,
            max: 0,
          },
        },
      },
    }));
  }, [conversations]);

  // Update pagination data when conversations change
  useEffect(() => {
    if (conversations) {
      setPaginationData({
        skip: conversations.skip || 0,
        limit: conversations.limit || itemsPerPage,
        count: conversations.count || 0,
        total_count: conversations.total_count || 0,
        total_pages: conversations.total_pages || 1,
      });
    }
  }, [conversations, itemsPerPage]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <PracticeHeader onStartNewSession={() => setIsSetupOpen(true)} />

        <div className="space-y-6">
          <ErrorBoundary>
            <PastSessionsTable sessions={processedSessions} />
            <SessionsPagination
              currentPage={currentPage}
              paginationData={paginationData}
              onPageChange={setCurrentPage}
            />
          </ErrorBoundary>
        </div>

        {/* Practice Session Setup Sheet */}
        <Sheet open={isSetupOpen} onOpenChange={setIsSetupOpen}>
          <SheetContent
            side="right"
            className="w-full max-w-3xl sm:max-w-4xl md:max-w-4xl h-screen overflow-y-auto flex flex-col"
          >
            <div className="flex h-full flex-col">
              <SheetHeader className="px-8 py-6 border-b">
                <SheetTitle className="text-2xl">
                  Start Practice Session
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto px-8 py-6">
                {!isSessionActive ? (
                  <SessionSetupForm
                    categories={categories}
                    products={products}
                    testConfigurations={testConfigurations}
                    selectedCategoryId={selectedCategoryId}
                    selectedProductId={selectedProductId}
                    selectedTestConfigId={selectedTestConfigId}
                    isSelectionLoading={isSelectionLoading}
                    setSelectedCategoryId={setSelectedCategoryId}
                    setSelectedProductId={setSelectedProductId}
                    setSelectedTestConfigId={setSelectedTestConfigId}
                    onStartSession={startSession}
                    isStartButtonDisabled={isStartButtonDisabled}
                    sessionError={sessionError}
                  />
                ) : (
                  <ChatInterface
                    products={products}
                    testConfigurations={testConfigurations}
                    selectedProductId={selectedProductId}
                    selectedTestConfigId={selectedTestConfigId}
                    conversationHistory={conversationHistory}
                    sessionLoading={sessionLoading}
                    salespersonInput={salespersonInput}
                    isRecording={isRecording}
                    isEnding={isEnding}
                    onSalespersonInputChange={setSalespersonInput}
                    onVoiceInput={handleVoiceInput}
                    onSendResponse={sendSalespersonAnswer}
                    onEndSession={endSession}
                  />
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Evaluation Results Dialog */}
        {evaluationResults && (
          <Dialog
            open={!!evaluationResults}
            onOpenChange={() => setEvaluationResults(null)}
          >
            <DialogContent className="max-w-3xl">
              <div>
                <h3 className="text-lg font-semibold mb-2">
                  Complete Conversation Evaluation:
                </h3>
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: evaluationResults.complete.replace(/\n/g, "<br/>"),
                  }}
                ></div>
              </div>
              {evaluationResults.additional && (
                <div>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Additional Criteria Evaluation:
                  </h3>
                  <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: evaluationResults.additional.replace(
                        /\n/g,
                        "<br/>"
                      ),
                    }}
                  ></div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
};

export default Practice;
