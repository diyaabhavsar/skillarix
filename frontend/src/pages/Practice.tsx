import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { SetupHeader } from "@/components/setup/SetupHeader";
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

  // Add ref for scroll area
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Add effect to scroll to bottom when conversation updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [conversationHistory]);

  useEffect(() => {
    if (!isSessionActive || !token) {
      websocketService.close();
      return;
    }

    const ws = websocketService.connect("/ws/chat", token, {
      debug: true,
      onOpen: () => {
        if (selectedProductId && selectedTestConfigId) {
          websocketService.startSession(selectedProductId, selectedTestConfigId);
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

    // Show answer immediately in the UI
    setConversationHistory((prev) => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[updated.length - 1].salesperson_text = salespersonInput;
      }
      return updated;
    });

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

  const endSession = () => {
    if (
      websocket &&
      websocket.readyState === WebSocket.OPEN &&
      selectedProductId &&
      selectedTestConfigId
    ) {
      setSessionLoading(true);
      websocket.send(
        JSON.stringify({
          type: "end_session",
          product_id: selectedProductId,
          history: conversationHistory,
          test_configuration_id: selectedTestConfigId,
        })
      );
    } else {
      setIsSessionActive(false);
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
    console.log("Session Complete:", data);
    setEvaluationResults({
      complete: data.complete_evaluation || "",
      additional: data.additional_criteria_evaluation,
    });
    setIsSessionActive(false);
    setSessionLoading(false);
  };

  const handleError = (data: WebSocketMessage) => {
    console.error("WebSocket Error from server:", data.content);
    setSessionError(data.content || "An error occurred during the session.");
    setIsSessionActive(false);
    setSessionLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <SetupHeader />

        {!isSessionActive ? (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Start Session</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="grid gap-2">
                <Label
                  htmlFor="select-category"
                  className="text-sm font-medium"
                >
                  Select Category
                </Label>
                <Select
                  onValueChange={setSelectedCategoryId}
                  value={selectedCategoryId}
                  disabled={isSelectionLoading}
                >
                  <SelectTrigger id="select-category">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="select-product" className="text-sm font-medium">
                  Select Product
                </Label>
                <Select
                  onValueChange={setSelectedProductId}
                  value={selectedProductId}
                  disabled={
                    isSelectionLoading ||
                    products.length === 0 ||
                    !selectedCategoryId
                  }
                >
                  <SelectTrigger id="select-product">
                    <SelectValue
                      placeholder={
                        selectedCategoryId
                          ? isSelectionLoading
                            ? "Loading products..."
                            : "Choose a product"
                          : "Select a category first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((prod) => (
                      <SelectItem key={prod.id} value={prod.id}>
                        {prod.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="select-test-config"
                  className="text-sm font-medium"
                >
                  Select Test Scenario
                </Label>
                <Select
                  onValueChange={setSelectedTestConfigId}
                  value={selectedTestConfigId}
                  disabled={
                    isSelectionLoading ||
                    testConfigurations.length === 0 ||
                    !selectedProductId
                  }
                >
                  <SelectTrigger id="select-test-config">
                    <SelectValue
                      placeholder={
                        selectedProductId
                          ? isSelectionLoading
                            ? "Loading scenarios..."
                            : "Choose a scenario"
                          : "Select a product first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {testConfigurations.map((config) => (
                      <SelectItem key={config.id} value={config.id}>
                        {config.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={startSession} disabled={isStartButtonDisabled}>
                {isSessionActive ? "Session in Progress" : "Start Session"}
              </Button>

              {sessionError && (
                <div className="text-red-500">{sessionError}</div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Practice Session</CardTitle>
              {selectedProductId && (
                <p className="text-sm text-muted-foreground">
                  Product:{" "}
                  {products.find((p) => p.id === selectedProductId)?.name ||
                    "N/A"}{" "}
                  | Scenario:{" "}
                  {testConfigurations.find((c) => c.id === selectedTestConfigId)
                    ?.name || "N/A"}
                </p>
              )}
            </CardHeader>
            <CardContent className="grid gap-6">
              <ScrollArea
                className="h-[400px] border rounded-md p-4"
                ref={scrollRef}
              >
                <div className="space-y-4">
                  {conversationHistory.map((pair, index) => (
                    <div
                      key={index}
                      className="mb-4 p-3 rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="font-semibold text-blue-600">Customer:</div>
                          <div className="pl-2">{pair.visitor_text}</div>
                        </div>
                        {pair.salesperson_text && (
                          <div className="flex flex-col gap-1">
                            <div className="font-semibold text-green-600">
                              Salesperson:
                            </div>
                            <div className="pl-2">{pair.salesperson_text}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {sessionLoading && (
                    <div className="italic text-muted-foreground text-center py-2">
                      AI is thinking...
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="grid gap-2">
                <Label
                  htmlFor="salesperson-input"
                  className="text-sm font-medium"
                >
                  Your Response
                </Label>
                <Textarea
                  id="salesperson-input"
                  placeholder="Type your response here..."
                  value={salespersonInput}
                  onChange={(e) => setSalespersonInput(e.target.value)}
                  disabled={sessionLoading}
                  rows={3}
                />
                <Button
                  onClick={sendSalespersonAnswer}
                  disabled={sessionLoading || !salespersonInput.trim()}
                >
                  {sessionLoading ? "Sending..." : "Send Response"}
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={endSession}
                  disabled={sessionLoading}
                >
                  End Session & Get Evaluation
                </Button>
              </div>

              {sessionError && (
                <div className="text-red-500 mt-4">{sessionError}</div>
              )}
            </CardContent>
          </Card>
        )}

        {evaluationResults && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Results</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Practice;
