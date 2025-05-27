
import { useState } from "react";
import { FilterSettings, Message } from "@/types/session";

export function useSessionState(productName: string) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "I'm interested in learning more about your product. Can you tell me about its main features?"
    }
  ]);
  const [response, setResponse] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [questionCount, setQuestionCount] = useState(1);
  
  // Filter state
  const [filterSettings, setFilterSettings] = useState<FilterSettings>({
    difficultyLevel: "medium",
    customerPersona: "technical",
    focusAreas: ["features", "benefits"],
    questionCount: 8
  });

  const handleSubmit = () => {
    if (!response.trim()) return;
    
    // Add user response
    setMessages([
      ...messages,
      { role: "user", content: response }
    ]);
    
    // Simulate evaluation
    setIsEvaluating(true);
    
    // Simulate API call for evaluation
    setTimeout(() => {
      setIsEvaluating(false);
      
      // Update message with evaluation
      setMessages(prev => {
        const newMessages = [...prev];
        const lastIndex = newMessages.length - 1;
        
        // Add evaluation to the last user message
        newMessages[lastIndex] = {
          ...newMessages[lastIndex],
          evaluation: {
            score: Math.floor(Math.random() * 5) + 6, // Score between 6-10
            feedback: "Good explanation of the features, but consider highlighting the unique selling points more directly.",
            idealAnswer: "Our product features an intuitive dashboard with real-time analytics, customizable reports, and seamless integration with existing tools. What sets us apart is our proprietary AI engine that provides predictive insights to help you make better decisions."
          }
        };
        
        // Add next customer question if needed
        if (questionCount < filterSettings.questionCount) {
          const nextQuestions = [
            "That sounds interesting. How does your product compare to competitors?",
            "What kind of support do you offer after purchase?",
            "Can you tell me about pricing options?",
            "How long does implementation typically take?",
            "Do you offer any customization options?",
            "What security measures are in place to protect data?",
            "Can you share some customer success stories?"
          ];
          
          // Choose a question based on difficulty and persona
          let questionIndex = (questionCount - 1) % nextQuestions.length;
          
          newMessages.push({
            role: "system",
            content: nextQuestions[questionIndex]
          });
          
          setQuestionCount(prev => prev + 1);
        }
        
        return newMessages;
      });
      
      setResponse("");
      
      // Check if mid-conversation evaluation is needed
      if (questionCount % 4 === 0) {
        // Trigger mid-conversation evaluation
        console.log("Mid-conversation evaluation triggered");
      }
    }, 2000);
  };

  const handleFilterChange = (key: keyof FilterSettings, value: any) => {
    setFilterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFocusArea = (area: string) => {
    setFilterSettings(prev => {
      const focusAreas = prev.focusAreas.includes(area) 
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area];
      
      return {
        ...prev,
        focusAreas
      };
    });
  };

  const resetFilters = () => {
    setFilterSettings({
      difficultyLevel: "medium",
      customerPersona: "technical",
      focusAreas: ["features", "benefits"],
      questionCount: 8
    });
  };

  return {
    messages,
    response,
    isEvaluating,
    questionCount,
    filterSettings,
    setResponse,
    handleSubmit,
    handleFilterChange,
    toggleFocusArea,
    resetFilters
  };
}
