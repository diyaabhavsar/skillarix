export interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

export interface SessionDetails {
  categoryId: string;
  productId: string;
  testConfigId: string;
  timestamp: string;
}

export interface EvaluationResults {
  complete: string;
  additional?: string;
}

export type MessageType = 
  | "question"
  | "next_question"
  | "evaluation"
  | "session_complete"
  | "error"
  | "answer"
  | "start"
  | "end_session"
  | "ping";

export interface BaseWebSocketMessage {
  type: MessageType;
  error?: string;
}

export interface QuestionMessage extends BaseWebSocketMessage {
  type: "question" | "next_question";
  content: string;
}

export interface EvaluationMessage extends BaseWebSocketMessage {
  type: "evaluation";
  evaluation: string;
  next_question?: string;
}

export interface SessionCompleteMessage extends BaseWebSocketMessage {
  type: "session_complete";
  complete_evaluation: string;
  additional_criteria_evaluation?: string;
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: "error";
  content: string;
}

export interface AnswerMessage extends BaseWebSocketMessage {
  type: "answer";
  product_id: string;
  test_configuration_id: string;
  last_question: string;
  answer: string;
  history: Array<ConversationPair>;
}

export interface StartMessage extends BaseWebSocketMessage {
  type: "start";
  product_id: string;
  test_configuration_id: string;
}

export interface EndSessionMessage extends BaseWebSocketMessage {
  type: "end_session";
  product_id: string;
  test_configuration_id: string;
  last_question: string;
  answer: string;
  history: Array<ConversationPair>;
}

export type WebSocketMessage = 
  | QuestionMessage 
  | EvaluationMessage 
  | SessionCompleteMessage 
  | ErrorMessage 
  | AnswerMessage 
  | StartMessage 
  | EndSessionMessage
  | { type: "ping" };
