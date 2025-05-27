
import { EndEvaluationData, MidEvaluationData } from "@/types/practice";

// Demo data for evaluations
export const mockMidEvaluationData: MidEvaluationData = {
  conversationDirection: {
    score: 2,
    maxScore: 3,
    details: [
      "Good progression toward solution",
      "Benefits clearly communicated"
    ]
  },
  informationConsistency: {
    score: 2,
    maxScore: 3,
    details: [
      "Consistently accurate information",
      "One minor contradiction noted"
    ]
  },
  customerEngagement: {
    score: 3,
    maxScore: 4,
    details: [
      "Strong rapport building",
      "All questions addressed directly",
      "Good follow-up questions"
    ]
  },
  totalScore: 7,
  maxScore: 10,
  recommendations: [
    "Ask more questions to understand customer needs",
    "Highlight how this product compares to alternatives",
    "Use more concrete examples in explanations"
  ]
};

export const mockEndEvaluationData: EndEvaluationData = {
  overallProgress: {
    score: 2,
    maxScore: 3
  },
  salesStrategy: {
    score: 3,
    maxScore: 3
  },
  customerJourney: {
    score: 1,
    maxScore: 2
  },
  technicalAccuracy: {
    score: 2, 
    maxScore: 2
  },
  totalScore: 8,
  maxScore: 10,
  keySuccessMoments: [
    "Excellent explanation of cloud security architecture in Q2",
    "Strong value proposition presented in response to pricing question",
    "Good use of competitor comparison when asked about alternatives"
  ],
  missedOpportunities: [
    "Could have asked about current security setup earlier",
    "Missed chance to discuss implementation timeline when customer showed interest"
  ],
  patternInsights: [
    "You consistently provide strong technical details",
    "Your responses tend to be more feature-focused than benefit-focused"
  ],
  recommendations: [
    "Focus more on connecting features to specific customer benefits",
    "Ask more probing questions about the customer's current situation",
    "Include more concrete examples of how other customers use the product"
  ]
};
