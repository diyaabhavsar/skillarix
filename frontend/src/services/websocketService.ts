import { env } from "@/config/env";
import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from 'react';

type MessageType = 
  | "question"
  | "next_question"
  | "evaluation"
  | "session_complete"
  | "error"
  | "answer"
  | "start"
  | "end_session"
  | "ping";

interface BaseWebSocketMessage {
  type: MessageType;
  error?: string;
}

interface QuestionMessage extends BaseWebSocketMessage {
  type: "question" | "next_question";
  content: string;
}

interface EvaluationMessage extends BaseWebSocketMessage {
  type: "evaluation";
  evaluation: string;
  next_question?: string;
}

interface SessionCompleteMessage extends BaseWebSocketMessage {
  type: "session_complete";
  complete_evaluation: string;
  additional_criteria_evaluation?: string;
}

interface ErrorMessage extends BaseWebSocketMessage {
  type: "error";
  content: string;
}

interface AnswerMessage extends BaseWebSocketMessage {
  type: "answer";
  product_id: string;
  test_configuration_id: string;
  last_question: string;
  answer: string;
  history: Array<{ visitor_text: string; salesperson_text: string }>;
}

interface StartMessage extends BaseWebSocketMessage {
  type: "start";
  product_id: string;
  test_configuration_id: string;
}

interface EndSessionMessage extends BaseWebSocketMessage {
  type: "end_session";
  product_id: string;
  test_configuration_id: string;
  last_question: string;
  answer: string;
  history: Array<{ visitor_text: string; salesperson_text: string }>;
}

type WebSocketMessage = 
  | QuestionMessage 
  | EvaluationMessage 
  | SessionCompleteMessage 
  | ErrorMessage 
  | AnswerMessage 
  | StartMessage 
  | EndSessionMessage
  | { type: "ping" };

// WebSocket Error Messages
export const WebSocketErrorMessages = {
  CONNECTION_FAILED: "Failed to establish WebSocket connection",
  CONNECTION_CLOSED: "Connection closed unexpectedly",
  INVALID_MESSAGE: "Invalid message format received",
  NOT_CONNECTED: "WebSocket not connected",
  SESSION_NOT_INITIALIZED: "Session not initialized",
  SEND_FAILED: "Failed to send message",
  AUTH_MISSING: "No authentication token found",
  UNEXPECTED_ERROR: "An unexpected error occurred",
} as const;

export interface WebSocketConfig {
  maxRetries?: number;
  retryDelay?: number;
  debug?: boolean;
  onOpen?: () => void;
  onMessage?: (data: WebSocketMessage) => void;
  onError?: (error: string | Error | Event) => void;
  onClose?: (event: CloseEvent) => void;
}

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const useWebsocket = (initialConfig: WebSocketConfig = {}) => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

  // Core refs
  const wsRef = useRef<WebSocket | null>(null);
  const configRef = useRef<Required<WebSocketConfig>>({
    maxRetries: 3,
    retryDelay: 1000,
    debug: false,
    onOpen: () => {},
    onMessage: () => {},
    onError: () => {},
    onClose: () => {},
    ...initialConfig,
  });

  // Connection management refs
  const attemptsRef = useRef(0);
  const maxAttemptsRef = useRef(3);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef(false);
  const pendingReconnectRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);
  const currentEndpointRef = useRef<string | null>(null);

  // Message handling refs
  const pendingMessagesRef = useRef<{ message: any; resolve: (success: boolean) => void }[]>([]);
  const batchedMessagesRef = useRef<WebSocketMessage[]>([]);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimestampRef = useRef<number>(Date.now());
  const lastQuestionRef = useRef<string | null>(null);
  const connectionPromiseRef = useRef<{ promise: Promise<void> | null; resolve: (() => void) | null }>({
    promise: null,
    resolve: null,
  });

  const createWebSocketUrl = useCallback((endpoint: string, token: string): string => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = env.WS_URL || window.location.origin.replace(/^http/, 'ws');
    const url = new URL(baseUrl + endpoint);
    url.searchParams.set('token', token);
    return url.toString();
  }, []);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (pendingReconnectRef.current) {
      clearTimeout(pendingReconnectRef.current);
      pendingReconnectRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    batchedMessagesRef.current = [];
    reconnectingRef.current = false;
    setState(prev => ({ ...prev, isConnected: false }));
  }, []);

  const handleError = useCallback((event: Event | Error) => {
    const errorMessage = event instanceof Error 
      ? event.message 
      : WebSocketErrorMessages.UNEXPECTED_ERROR;

    if (configRef.current.debug) {
      console.error("[WebSocket] Error:", errorMessage);
    }

    setState(prev => ({ ...prev, error: errorMessage }));
    configRef.current.onError?.(errorMessage);
  }, []);

  const sendImmediate = useCallback(async (message: any): Promise<boolean> => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      wsRef.current.send(JSON.stringify(message));
      if (configRef.current.debug) {
        console.log("[WebSocket] Message sent:", message);
      }
      return true;
    } catch (error) {
      handleError(error as Error);
      return false;
    }
  }, [handleError]);

  const processMessages = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }

    if (batchedMessagesRef.current.length > 0) {
      const messages = [...batchedMessagesRef.current];
      batchedMessagesRef.current = [];

      requestAnimationFrame(() => {
        messages.forEach(msg => {
          if (msg.type !== 'ping') {
            configRef.current.onMessage?.(msg);
          }
        });

        if (batchedMessagesRef.current.length > 0) {
          processMessages();
        }
      });
    }
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      lastMessageTimestampRef.current = Date.now();

      if (configRef.current.debug && data.type !== 'ping') {
        console.log("[WebSocket] Message received:", data);
      }
      
      if ('error' in data && data.error) {
        handleError(new Error(data.error));
        return;
      }

      // Add to batch and process
      batchedMessagesRef.current.push(data);
      processMessages();
    } catch (error) {
      handleError(new Error(WebSocketErrorMessages.INVALID_MESSAGE));
    }
  }, [processMessages, handleError]);

  const connect = useCallback(async (endpoint: string, token: string, config: WebSocketConfig = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    Object.assign(configRef.current, config);
    tokenRef.current = token;
    currentEndpointRef.current = endpoint;
    
    setState(prev => ({ ...prev, isConnecting: true }));

    try {
      cleanup();
      const wsUrl = createWebSocketUrl(endpoint, token);
      
      if (configRef.current.debug) {
        console.log('[WebSocket] Connecting to:', wsUrl);
      }

      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        if (configRef.current.debug) console.log("[WebSocket] Connected successfully");
        attemptsRef.current = 0;
        reconnectingRef.current = false;
        setupPing();
        connectionPromiseRef.current.resolve?.();
        connectionPromiseRef.current = { promise: null, resolve: null };
        configRef.current.onOpen?.();
        setState(prev => ({ ...prev, isConnected: true, isConnecting: false, error: null }));
        
        // Process any pending messages
        while (pendingMessagesRef.current.length > 0) {
          const { message, resolve } = pendingMessagesRef.current.shift()!;
          sendImmediate(message).then(resolve);
        }
      };

      wsRef.current.onmessage = handleMessage;
      wsRef.current.onerror = handleError;
      wsRef.current.onclose = handleClose;

      await new Promise<void>((resolve, reject) => {
        connectionPromiseRef.current = {
          promise: new Promise<void>((res) => resolve(res())),
          resolve,
        };
        setTimeout(() => reject(new Error('Connection timeout')), 5000);
      });

      return wsRef.current;
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, isConnecting: false, error: (error as Error).message }));
      if (attemptsRef.current < maxAttemptsRef.current) {
        reconnect();
      }
      throw error;
    }
  }, [cleanup, createWebSocketUrl, handleMessage, handleError, sendImmediate]);

  const reconnect = useCallback(() => {
    if (reconnectingRef.current || attemptsRef.current >= maxAttemptsRef.current || !tokenRef.current || !currentEndpointRef.current) return;
    
    reconnectingRef.current = true;
    const delay = Math.min(1000 * Math.pow(2, attemptsRef.current), 5000);
    attemptsRef.current++;

    if (configRef.current.debug) {
      console.log(`[WebSocket] Attempting reconnect ${attemptsRef.current}/${maxAttemptsRef.current} in ${delay}ms`);
    }

    pendingReconnectRef.current = setTimeout(() => {
      connect(currentEndpointRef.current!, tokenRef.current!, configRef.current);
    }, delay);
  }, [connect]);

  const handleClose = useCallback((event: CloseEvent) => {
    const wasClean = event.wasClean || event.code === 1000;
    
    if (configRef.current.debug) {
      console.log(`[WebSocket] Closed. Clean: ${wasClean}, Code: ${event.code}, Reason: ${event.reason}`);
    }

    configRef.current.onClose?.(event);
    setState(prev => ({ ...prev, isConnected: false }));
    
    if (!wasClean && !reconnectingRef.current && attemptsRef.current < maxAttemptsRef.current) {
      reconnect();
    } else if (attemptsRef.current >= maxAttemptsRef.current) {
      toast.error("Connection lost. Please refresh the page.");
    }
  }, [reconnect]);

  const send = useCallback(async (message: Partial<WebSocketMessage>): Promise<boolean> => {
    lastMessageTimestampRef.current = Date.now();

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      if (!reconnectingRef.current && attemptsRef.current < maxAttemptsRef.current) {
        try {
          await connect(currentEndpointRef.current!, tokenRef.current!, configRef.current);
        } catch (error) {
          handleError(error as Error);
          return false;
        }
      }
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return new Promise((resolve) => {
        pendingMessagesRef.current.push({ message, resolve });
      });
    }

    return sendImmediate(message);
  }, [connect, handleError, sendImmediate]);

  const setupPing = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        const now = Date.now();
        if (now - lastMessageTimestampRef.current > 20000) {
          send({ type: "ping" });
        }
      } else {
        cleanup();
        if (!reconnectingRef.current && attemptsRef.current < maxAttemptsRef.current) {
          reconnect();
        }
      }
    }, 30000);
  }, [send, cleanup, reconnect]);

  const sendAnswer = useCallback((data: Omit<AnswerMessage, "type">): Promise<boolean> => {
    return send({
      type: "answer",
      ...data,
    });
  }, [send]);

  const startSession = useCallback((product_id: string, test_configuration_id: string): Promise<boolean> => {
    return send({
      type: "start",
      product_id,
      test_configuration_id,
    });
  }, [send]);

  const endSession = useCallback((data: Omit<EndSessionMessage, "type">): Promise<boolean> => {
    return send({
      type: "end_session",
      ...data,
    });
  }, [send]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    ...state,
    connect,
    send,
    sendAnswer,
    startSession,
    endSession,
    cleanup,
  };
};
