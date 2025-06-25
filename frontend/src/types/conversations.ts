export interface Rating {
  score: number;
  max: number;
}

export interface CompleteRating {
  overall_progress: Rating;
  sales_strategy: Rating;
  customer_journey: Rating;
  technical_accuracy: Rating;
  total: Rating;
}

export interface ConversationEvaluation {
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
        question_relevance: Rating;
        technical_accuracy: Rating;
        sales_effectiveness: Rating;
        total: Rating;
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
    complete_rating: CompleteRating;
    is_complete: boolean;
    additional_criteria_evaluation: {
      distraction_handling: string;
    };
    test_configuration_id: string;
  };
  created_at: string;
  updated_at: string;
  testConfigurationId?: string; // Add this property to the type definition
}

export interface ConversationsResponse {
  data: ConversationEvaluation[];
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}
