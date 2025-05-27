
export const feedbackData = {
  id: "s1",
  date: "2025-05-12",
  time: "14:30",
  product: "Sales Navigator Pro",
  totalScore: 82,
  midEvaluations: [
    {
      id: "mid1",
      conversationDirection: 2,
      informationConsistency: 3,
      customerEngagement: 3,
      recommendations: [
        "Focus more on asking open-ended questions",
        "Remember to address the customer by name",
        "Provide more specific product examples"
      ]
    }
  ],
  finalEvaluation: {
    overallProgress: 2,
    salesStrategy: 2,
    customerJourney: 2,
    technicalAccuracy: 2,
    successMoments: [
      "Excellent product knowledge demonstration",
      "Good handling of pricing objections"
    ],
    missedOpportunities: [
      "Could have explored customer's specific use case more",
      "Missed opportunity to mention the new integration feature"
    ],
    patterns: [
      "Strong on technical details but could improve on relational aspects",
      "Tend to rush through solutions before fully understanding problems"
    ],
    recommendations: [
      "Practice active listening techniques",
      "Develop a more structured approach to uncovering customer needs",
      "Review competitor differential features for better positioning"
    ]
  },
  qaHistory: [
    {
      id: "q1",
      question: "Can you tell me more about your product's analytics features?",
      userAnswer: "Our analytics feature provides real-time data visualization with customizable dashboards. You can track key metrics and set up automated reports based on your specific KPIs.",
      modelAnswer: "Our product includes advanced analytics capabilities with real-time data visualization through interactive dashboards. You can customize these views to track specific metrics important to your business and set up automated reports delivered via email or Slack. What kind of metrics would be most valuable for you to track?",
      score: 8,
      feedback: "Good technical explanation but missed opportunity to engage the customer with a follow-up question."
    },
    {
      id: "q2",
      question: "How does your pricing compare to Competitor X?",
      userAnswer: "We offer better value than Competitor X. Our pricing starts at $49/month which includes all core features, whereas they charge extra for those.",
      modelAnswer: "While our base plan starts at $49/month compared to Competitor X's $39/month, we include all core features in our base plan, including analytics and team collaboration which they charge as add-ons. When considering these additional costs, our solution typically provides 20-30% better value for most customers. May I ask which specific features are most important to your team?",
      score: 7,
      feedback: "Mentioned the value proposition but could be more specific with numerical comparisons and missed engaging the customer about their specific needs."
    },
    {
      id: "q3",
      question: "What kind of support do you offer?",
      userAnswer: "We offer 24/7 customer support via chat, email, and phone. Our enterprise plans also include a dedicated account manager who can help with implementation and optimization.",
      modelAnswer: "We provide comprehensive 24/7 support through multiple channels including chat, email, and phone with an average response time of under 2 hours. Enterprise plans include a dedicated account manager who conducts quarterly reviews and optimization sessions. All customers also have access to our knowledge base and community forum. What support channels does your team typically prefer?",
      score: 8,
      feedback: "Good overview of support options but could have included response times and additional resources."
    }
  ]
};
