import { env } from "@/config/env";
import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  WebSocketMessage,
  MessageType,
  BaseWebSocketMessage,
  QuestionMessage,
  EvaluationMessage,
  SessionCompleteMessage,
  ErrorMessage,
  AnswerMessage,
  StartMessage,
  EndSessionMessage,
} from "@/types/websocket";

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

export const useWebSocket = (initialConfig: WebSocketConfig = {}) => {
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });

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

  const attemptsRef = useRef(0);
  const maxAttemptsRef = useRef(3);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectingRef = useRef(false);
  const pendingReconnectRef = useRef<NodeJS.Timeout | null>(null);
  const tokenRef = useRef<string | null>(null);
  const currentEndpointRef = useRef<string | null>(null);
  const messageQueueRef = useRef<{ message: any; resolve: (success: boolean) => void }[]>([]);
  const connectionPromiseRef = useRef<{ promise: Promise<void> | null; resolve: (() => void) | null }>({
    promise: null,
    resolve: null,
  });
  const lastProcessedMessageIdRef = useRef<string | null>(null);
  const lastQuestionContentRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
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

  const setupPing = useCallback(() => {
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        send({ type: "ping" });
      } else {
        cleanup();
        if (!reconnectingRef.current && attemptsRef.current < maxAttemptsRef.current) {
          reconnect();
        }
      }
    }, 30000);
  }, []);

  const generateMessageId = useCallback((message: WebSocketMessage): string => {
    if ('content' in message) {
      return `${message.type}-${message.content}`;
    }
    return `${message.type}-${Date.now()}`;
  }, []);

  const isDuplicateQuestion = useCallback((message: QuestionMessage): boolean => {
    if (lastQuestionContentRef.current === message.content) {
      return true;
    }
    lastQuestionContentRef.current = message.content;
    return false;
  }, []);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      const { debug, onMessage } = configRef.current;

      if (debug && data.type !== 'ping') {
        console.log("[WebSocket] Message received:", data);
      }
      
      if ('error' in data && data.error) {
        handleError(new Error(data.error));
        return;
      }

      const messageId = generateMessageId(data);
      
      if (lastProcessedMessageIdRef.current === messageId) {
        console.log("[WebSocket] Skipping duplicate message:", data.type);
        return;
      }

      lastProcessedMessageIdRef.current = messageId;

      switch (data.type) {
        case 'question':
          onMessage(data);
          break;
        case 'next_question':
          if (!isDuplicateQuestion(data)) {
            onMessage(data);
          }
          break;
        default:
          onMessage(data);
      }
    } catch (error) {
      handleError(new Error(WebSocketErrorMessages.INVALID_MESSAGE));
    }
  }, []);

  const createWebSocketUrl = useCallback((endpoint: string, token: string): string => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseUrl = env.WS_URL || window.location.origin.replace(/^http/, 'ws');
    const url = new URL(baseUrl + endpoint);
    url.searchParams.set('token', token);
    return url.toString();
  }, []);

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
  }, []);

  const connect = useCallback(async (endpoint: string, token: string, config: WebSocketConfig = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    Object.assign(configRef.current, config);
    tokenRef.current = token;
    currentEndpointRef.current = endpoint;
    
    setState(prev => ({ ...prev, isConnecting: true }));

    if (!connectionPromiseRef.current.promise) {
      connectionPromiseRef.current.promise = new Promise((resolve) => {
        connectionPromiseRef.current.resolve = resolve;
      });
    }
    
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
        processPendingMessages();
      };

      wsRef.current.onmessage = handleMessage;
      wsRef.current.onerror = handleError;

      wsRef.current.onclose = (event) => {
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
      };

      await Promise.race([
        connectionPromiseRef.current.promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
      ]);

      return wsRef.current;
    } catch (error) {
      handleError(error as Error);
      setState(prev => ({ ...prev, isConnecting: false, error: (error as Error).message }));
      if (attemptsRef.current < maxAttemptsRef.current) {
        reconnect();
      }
      throw error;
    }
  }, []);

  const processPendingMessages = useCallback(async () => {
    while (messageQueueRef.current.length > 0) {
      const { message, resolve } = messageQueueRef.current.shift()!;
      const success = await sendImmediate(message);
      resolve(success);
    }
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
  }, []);

  const send = useCallback(async (message: Partial<WebSocketMessage>): Promise<boolean> => {
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
        messageQueueRef.current.push({ message, resolve });
      });
    }

    return sendImmediate(message);
  }, []);

  const sendAnswer = useCallback(async (data: Omit<AnswerMessage, "type">): Promise<boolean> => {
    return send({
      type: "answer",
      ...data,
    });
  }, []);

  const startSession = useCallback(async (product_id: string, test_configuration_id: string): Promise<boolean> => {
    return send({
      type: "start",
      product_id,
      test_configuration_id,
    });
  }, []);

  const endSession = useCallback(async (data: Omit<EndSessionMessage, "type">): Promise<boolean> => {
    return send({
      type: "end_session",
      ...data,
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

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
