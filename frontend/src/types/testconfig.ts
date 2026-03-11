export type VisitorPersona = {
  product_knowledge: string;
  product_familiarity: string;
  technical_expertise: string;
  key_challenges: string;
  buying_objective: string;
  budget_range: string;
  decision_authority: string;
  exhibition_objective: string;
  category?: string;
  // Dynamic fields
  name?: string;
  visitor_type?: string;
  background?: string;
  pain_points?: string;
  goals?: string;
  distraction_handling?: string;
  communication_simplicity?: string;
};

export type AdditionalCriteria = {
  distraction_handling: boolean;
  communication_simplicity: boolean;
};

export type Test = {
  _id: string;
  name: string;
  promptId?: string;
  product_id: string;
  visitorPersona: VisitorPersona;
  additionalCriteria: AdditionalCriteria;
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  category_id?: string;
  assessment?: boolean;
  promptInfo?: string;
};

export type TestConfigurationFormProps = {
  initialData?: {
    id?: string;
    name: string;
    product_id: string;
    category_id: string;
    visitorPersona: VisitorPersona;
    additionalCriteria: AdditionalCriteria;
    assessment?: boolean;
    promptInfo?: string;
  };
  onSuccess?: () => void;
};