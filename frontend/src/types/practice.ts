export type Question = {
  id: number;
  content: string;
  userResponse?: string;
  evaluation?: {
    score: number;
    feedback: string;
    modelAnswer: string;
  };
  status: "pending" | "answered" | "evaluated";
};

export type MidEvaluationData = {
  conversationDirection: {
    score: number;
    maxScore: number;
    details: string[];
  };
  informationConsistency: {
    score: number;
    maxScore: number;
    details: string[];
  };
  customerEngagement: {
    score: number;
    maxScore: number;
    details: string[];
  };
  totalScore: number;
  maxScore: number;
  recommendations: string[];
};

export type EndEvaluationData = {
  overallProgress: {
    score: number;
    maxScore: number;
  };
  salesStrategy: {
    score: number;
    maxScore: number;
  };
  customerJourney: {
    score: number;
    maxScore: number;
  };
  technicalAccuracy: {
    score: number; 
    maxScore: number;
  };
  totalScore: number;
  maxScore: number;
  keySuccessMoments: string[];
  missedOpportunities: string[];
  patternInsights: string[];
  recommendations: string[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category_id: string;
}

export interface TestConfiguration {
  id: string;
  name: string;
  product_id: string;
  visitorPersona: { [key: string]: any };
  additionalCriteria: { [key: string]: boolean };
  created_at: string;
}

export interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

export interface Category {
  id: string;
  name: string;
}
