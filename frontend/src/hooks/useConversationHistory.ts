import { useState } from "react";
import { api } from "@/utils/api";

interface ConversationEvaluation {
  _id: string;
  product_id: string;
  category_id: string;
  user_id: string;
  test_name: string;
  prod_name: string;
  cat_name: string;
  conversation_data: {
    pairs: {
      visitor_text: string;
      salesperson_text: string;
    }[];
  };
  evaluation_data: {
    individual_evaluations: {
      evaluation: string;
      rating: {
        question_relevance: { score: number; max: number };
        technical_accuracy: { score: number; max: number };
        sales_effectiveness: { score: number; max: number };
        total: { score: number; max: number };
      };
    }[];
    mid_evaluations: string[];
    complete_evaluation: {
      Overall_Progress: string;
      Sales_Strategy: string;
      Customer_Journey: string;
      Technical_Accuracy: string;
      Key_successful_moments_in_the_conversation: string;
      Critical_missed_opportunities: string;
      "Pattern_analysis_of_effective/ineffective_techniques_used": string;
      Recommendations_for_future_conversations: string;
    };
    complete_rating: {
      total: { score: number; max: number };
    };
    is_complete: boolean;
    additional_criteria_evaluation: {
      distraction_handling: string;
    };
    test_configuration_id: string;
  };
  created_at: string;
  updated_at: string;
}

interface ConversationsResponse {
  data: ConversationEvaluation[];
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

export function useConversationHistory() {
  const [conversations, setConversations] = useState<ConversationsResponse | null>(null);
  const [currentConversation, setCurrentConversation] = useState<ConversationEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get<ConversationsResponse>("/conversations");
      setConversations(response);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch conversations"));
    } finally {
      setLoading(false);
    }
  };

  const fetchConversationById = async (productId: string, conversationId: string) => {
    try {
      setLoading(true);
      const response = await api.get<ConversationEvaluation>(`/conversations/${productId}/${conversationId}`);
      setCurrentConversation(response);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error("Failed to load conversation details");
      setError(errorMessage);
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