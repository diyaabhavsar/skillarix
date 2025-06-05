import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface EvaluationData {
  current_evaluation?: string;
  mid_evaluations?: string[];
  complete_evaluation?: string;
  metrics?: {
    total_exchanges: number;
    average_response_length: number;
    customer_engagement_score: number;
    [key: string]: any;
  };
  score?: number;
  additional_criteria_evaluation?: string;
}

interface Conversation {
  _id: string;
  product_id: string;
  user_id: string;
  conversation_data: ConversationPair[];
  evaluation_data: EvaluationData;
  created_at: string;
  updated_at: string;
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { token } = useAuth();

  const fetchConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8000/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }
      const data = await response.json();
      setConversations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Failed to load conversation history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationById = async (productId: string, conversationId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/conversations/${productId}/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch conversation");
      }
      const data = await response.json();
      setCurrentConversation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    conversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    fetchConversationById,
  };
}