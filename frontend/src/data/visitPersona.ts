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
  distraction_handling: [
    { value: 'none', label: 'None' },
    { value: 'low', label: 'Low (check phone once)' },
    { value: 'moderate', label: 'Moderate (distracted by passersby)' },
    { value: 'high', label: 'High (frequently interrupts)' },
  ],
  communication_simplicity: [
    { value: 'technical', label: 'Technical / Jargon-heavy' },
    { value: 'normal', label: 'Normal / Professional' },
    { value: 'simple', label: 'Simple / Layman terms' },
  ],
};


export const visitorPersonaFields = [
  {
    key: "name",
    label: "Visitor Name",
    description: "The persona's name (e.g., Dr. Sarah)",
  },
  {
    key: "visitor_type",
    label: "Role / Job Title",
    description: "e.g., CTO, Procurement Manager",
  },
  {
    key: "background",
    label: "Background",
    description: "Short bio or context about the visitor",
  },
  {
    key: "pain_points",
    label: "Pain Points",
    description: "Specific problems they want to solve",
  },
  {
    key: "goals",
    label: "Goals",
    description: "What they hope to achieve",
  },
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
    description: "Their comfort level with technical details",
  },
  {
    key: "key_challenges",
    label: "Key Challenge",
    description: "The primary problem they need solved",
  },
  {
    key: "buying_objective",
    label: "Buying Objective",
    description: "What outcome they need (e.g., save money)",
  },
  {
    key: "budget_range",
    label: "Budget Range",
    description: "Price sensitivity level",
  },
  {
    key: "decision_authority",
    label: "Decision Authority",
    description: "Who makes the final call",
  },
  {
    key: "exhibition_objective",
    label: "Exhibition Objective",
    description: "Why they are talking to you right now",
  },
  {
    key: "distraction_handling",
    label: "Distraction Handling",
    description: "How easily distracted they are (if applicable)",
  },
  {
    key: "communication_simplicity",
    label: "Communication Simplicity",
    description: "Preferred complexity of language",
  },
];
