export const VISITOR_PERSONA_OPTIONS = {
  product_knowledge: [
    { value: 'none', label: 'None' },
    { value: 'name-only', label: 'Name-only' },
    { value: 'saw-ad', label: 'Saw ad/brochure' },
    { value: 'peer-heard', label: 'Peer-heard' },
    { value: 'very-familiar', label: 'Very familiar' },
  ],
  product_familiarity: [
    { value: 'never-seen', label: 'Never seen' },
    { value: 'handled-briefly', label: 'Handled briefly' },
    { value: 'tried-sample', label: 'Tried sample' },
    { value: 'similar-user', label: 'Similar user' },
    { value: 'loyal-user', label: 'Loyal user' },
  ],
  technical_expertise: [
    { value: 'general', label: 'General' },
    { value: 'basic', label: 'Basic' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' },
  ],
  key_challenges: [
    { value: 'cost-control', label: 'Cost control' },
    { value: 'quality', label: 'Quality/reliability' },
    { value: 'compliance', label: 'Compliance' },
    { value: 'simplicity', label: 'Simplicity' },
    { value: 'trust', label: 'Trust in vendor' },
    { value: 'sustainability', label: 'Sustainability' },
  ],
  buying_objective: [
    { value: 'save-money', label: 'Save money' },
    { value: 'boost-quality', label: 'Boost quality' },
    { value: 'meet-standards', label: 'Meet standards' },
    { value: 'upgrade', label: 'Upgrade' },
    { value: 'future-planning', label: 'Future planning' },
  ],
  budget_range: [
    { value: 'very-low', label: 'Very low' },
    { value: 'low', label: 'Low' },
    { value: 'mid', label: 'Mid' },
    { value: 'high', label: 'High' },
    { value: 'very-high', label: 'Very high' },
  ],
  decision_authority: [
    { value: 'user', label: 'User' },
    { value: 'influencer', label: 'Influencer' },
    { value: 'evaluator', label: 'Evaluator' },
    { value: 'approver', label: 'Approver' },
    { value: 'final-sign-off', label: 'Final sign-off' },
  ],
  exhibition_objective: [
    { value: 'info-gathering', label: 'Info gathering' },
    { value: 'spec-comparison', label: 'Spec comparison' },
    { value: 'pricing-talk', label: 'Pricing talk' },
    { value: 'terms-warranty', label: 'Terms/warranty' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'demo-booking', label: 'Demo booking' },
  ],
};


export const visitorPersonaFields = [
  {
    key: "product_knowledge",
    label: "Product Knowledge",
    description: "How much they've heard about the product before today",
  },
  {
    key: "product_familiarity",
    label: "Product Familiarity",
    description: "How they've interacted with or experienced it",
  },
  {
    key: "technical_expertise",
    label: "Technical Expertise",
    description: "How comfortable they are with product-related details",
  },
  {
    key: "key_challenges",
    label: "Key Challenges",
    description: "Their primary concern or pain point",
  },
  {
    key: "buying_objective",
    label: "Buying Objective",
    description: "Their main \"why\" today",
  },
  {
    key: "budget_range",
    label: "Budget Range",
    description: "Their rough spend capacity",
  },
  {
    key: "decision_authority",
    label: "Decision Authority",
    description: "Their role in the purchase process",
  },
  {
    key: "exhibition_objective",
    label: "Exhibition Objective",
    description: "What they want to achieve at your booth",
  },
];

