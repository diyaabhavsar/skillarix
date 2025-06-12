import { env } from "@/config/env";
import { toast } from "sonner";

interface WebSocketConfig {
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
  onOpen?: () => void;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onClose?: (event: CloseEvent) => void;
}

interface WebSocketMessage {
  type:
    | "question"
    | "next_question"
    | "evaluation"
    | "session_complete"
    | "error"
    | "answer"
    | "start"
    | "end_session"
    | "ping";
  content?: string;
  evaluation?: string;
  next_question?: string;
  complete_evaluation?: string;
  additional_criteria_evaluation?: string;
  product_id?: string;
  test_configuration_id?: string;
  last_question?: string;
  answer?: string;
  history?: Array<{ visitor_text: string; salesperson_text: string }>;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private attempts = 0;
  private pingInterval: NodeJS.Timeout | null = null;
  private config: Required<WebSocketConfig>;

  constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      debug: false,
      onOpen: () => {},
      onMessage: () => {},
      onError: () => {},
      onClose: () => {},
    };
  }

  private cleanup() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.ws?.close();
    this.ws = null;
  }

  private setupPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);
  }

  connect(endpoint: string, token: string, config: WebSocketConfig = {}) {
    this.config = { ...this.config, ...config };
    const {
      debug,
      maxRetries,
      retryDelay,
      onOpen,
      onMessage,
      onError,
      onClose,
    } = this.config;

    try {
      this.cleanup();
      const url = new URL(`${env.WS_URL}${endpoint}`);
      url.searchParams.append("token", token);

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        if (debug) console.log("WebSocket connected successfully");
        this.attempts = 0;
        this.setupPing();
        this.setupMessageHandler(onMessage, debug);
        onOpen();
      };

      this.ws.onclose = (event) => {
        this.cleanup();
        if (!event.wasClean && this.attempts < maxRetries) {
          this.attempts++;
          if (debug)
           
          setTimeout(
            () => this.connect(endpoint, token, config),
            retryDelay * this.attempts
          );
        } else if (this.attempts >= maxRetries) {
          toast.error("Connection lost. Please refresh the page.");
        }
        onClose(event);
      };

      this.ws.onerror = (error) => {
        if (debug || process.env.NODE_ENV === "development") {
          console.error("WebSocket error:", error);
        }
        onError(error);
        this.ws?.close();
      };

      return this.ws;
    } catch (error) {
      if (debug) console.error("WebSocket connection error:", error);
      setTimeout(
        () => this.connect(endpoint, token, config),
        retryDelay * this.attempts
      );
      throw error;
    }
  }

  send(message: Partial<WebSocketMessage>) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
   return false;
  }

  sendAnswer(data: {
    product_id: string;
    test_configuration_id: string;
    last_question: string;
    answer: string;
    history: Array<{ visitor_text: string; salesperson_text: string }>;
  }) {
    return this.send({
      type: "answer",
      ...data,
    });
  }

  startSession(product_id: string, test_configuration_id: string) {
    return this.send({
      type: "start",
      product_id,
      test_configuration_id,
    });
  }

  endSession(
    product_id: string,
    test_configuration_id: string,
    history: Array<{ visitor_text: string; salesperson_text: string }>
  ) {
    return this.send({
      type: "end_session",
      product_id,
      test_configuration_id,
      history,
    });
  }

  private setupMessageHandler(
    onMessage: (data: WebSocketMessage) => void,
    debug = false
  ) {
    if (!this.ws) return;

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        if (debug) {
          console.log("WebSocket message received:", data);
        }

        // Normalize message types
        if (data.type === "next_question") {
          onMessage({
            type: "question",
            content: data.content,
          });
        } else if (data.type === "question") {
          onMessage({
            type: "question",
            content: data.content,
          });
        } else {
          onMessage(data);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };
  }

  close() {
    this.cleanup();
  }

  isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
