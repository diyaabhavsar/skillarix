import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const usePracticeSession = () => {
  const [chatMessages, setChatMessages] = useState([
    { sender: "llm", text: "Can you tell me about the main features of your product?" }
  ]);
  const [userResponse, setUserResponse] = useState("");
  const [isEndEvaluationOpen, setIsEndEvaluationOpen] = useState(false);
  const [waitingForLLM, setWaitingForLLM] = useState(false);

  // Simulate LLM backend for next question
  const llmQuestions = [
    "How does your product compare to competitors in the market?",
    "What kind of support do you offer after purchase?",
    "Can you explain your pricing structure?",
    "Do you offer any customization options?",
  ];
  const [llmIndex, setLlmIndex] = useState(0);

  const handleResponseChange = (response: string) => setUserResponse(response);

  const submitResponse = () => {
    if (!userResponse.trim()) return;
    // Add user message
    setChatMessages(prev => [...prev, { sender: "user", text: userResponse }]);
    setUserResponse("");
    // Simulate LLM thinking
    setWaitingForLLM(true);
    setTimeout(() => {
      if (llmIndex < llmQuestions.length) {
        setChatMessages(prev => [
          ...prev,
          { sender: "llm", text: llmQuestions[llmIndex] }
        ]);
        setLlmIndex(idx => idx + 1);
        setWaitingForLLM(false);
      } else {
        // No more questions, optionally prompt to end
        setWaitingForLLM(false);
      }
    }, 1200);
  };

  const handleEndSession = () => {
    setIsEndEvaluationOpen(true);
  };

  const handleNewSession = () => {
    setIsEndEvaluationOpen(false);
    setChatMessages([
      { sender: "llm", text: "Can you tell me about the main features of your product?" }
    ]);
    setLlmIndex(0);
    setUserResponse("");
  };

  return {
    chatMessages,
    userResponse,
    isEndEvaluationOpen,
    setIsEndEvaluationOpen,
    handleResponseChange,
    submitResponse,
    handleEndSession,
    handleNewSession,
    waitingForLLM,
  };
};
