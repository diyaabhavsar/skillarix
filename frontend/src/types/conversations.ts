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

export interface IndividualEvaluation {
  evaluation: string;
  reference_answer?: string;
  rating: {
    question_relevance: Rating;
    technical_accuracy: Rating;
    sales_effectiveness: Rating;
    total: Rating;
  };
}

export interface ConversationEvaluation {
  _id: string;
  product_id: string;
  user_id: string;
  category_id: string;
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
    individual_evaluations: IndividualEvaluation[];
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
    additional_criteria_evaluation: {
      distraction_handling: string;
    };
    is_complete: boolean;
    test_configuration_id: string;
  };
  created_at: string;
  updated_at: string;
}
