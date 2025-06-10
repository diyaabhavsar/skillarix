import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/utils/api';

interface ConversationPair {
    visitor_text: string;
    salesperson_text: string;
}

export const useWebSocketSession = (
    isSessionActive: boolean,
    selectedProductId: string,
    selectedTestConfigId: string
) => {
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [conversationHistory, setConversationHistory] = useState<ConversationPair[]>([]);
    const [currentCustomerQuestion, setCurrentCustomerQuestion] = useState('');
    const [evaluationResults, setEvaluationResults] = useState<any>(null);
    const [salespersonInput, setSalespersonInput] = useState('');
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const maxRetries = 3;
    const retryDelay = 2000; // 2 seconds

    const cleanupWebSocket = useCallback(() => {
        if (websocket) {
            websocket.close();
            setWebsocket(null);
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
    }, [websocket]);

    const connectWebSocket = useCallback(() => {
        let connectionAttempts = 0;

        const tryConnect = () => {
            if (connectionAttempts >= maxRetries) {
                setSessionError('Failed to connect after multiple attempts');
                return;
            }

            const ws = api.connectWebSocket('/ws/chat');

            ws.onopen = () => {
                setWebsocket(ws);
                setSessionError(null);
                connectionAttempts = 0;
            };

            ws.onclose = (event) => {
                if (!event.wasClean && connectionAttempts < maxRetries) {
                    connectionAttempts++;
                    reconnectTimeoutRef.current = setTimeout(tryConnect, retryDelay);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                ws.close();
            };
        };

        tryConnect();
    }, []);

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'question':
                    setCurrentCustomerQuestion(data.content);
                    break;
                case 'next_question':
                    // Add previous Q&A to history and set new question
                    setConversationHistory((prev) => [
                        ...prev,
                        {
                            visitor_text: currentCustomerQuestion,
                            salesperson_text: salespersonInput,
                        },
                    ]);
                    setCurrentCustomerQuestion(data.content);
                    setSalespersonInput('');
                    setSessionLoading(false);
                    break;
                case 'end_session':
                    setEvaluationResults(data.evaluation);
                    setSessionLoading(false);
                    break;
                case 'error':
                    setSessionError(data.message);
                    setSessionLoading(false);
                    break;
            }
        },
        [currentCustomerQuestion, salespersonInput]
    );

    useEffect(() => {
        if (!isSessionActive) {
            cleanupWebSocket();
            return;
        }

        const ws = api.connectWebSocket('/ws/chat');

        ws.onmessage = handleMessage;

        return () => {
            ws.close();
            cleanupWebSocket();
        };
    }, [isSessionActive, handleMessage, cleanupWebSocket]);

    const sendAnswer = useCallback(
        (answerOrEvent: string | React.MouseEvent) => {
            const answer = typeof answerOrEvent === 'string' ? answerOrEvent : salespersonInput;

            if (!websocket || websocket.readyState !== WebSocket.OPEN || !answer.trim()) {
                return;
            }

            websocket.send(
                JSON.stringify({
                    type: 'answer',
                    answer: answer,
                    history: conversationHistory,
                    last_question: currentCustomerQuestion,
                    product_id: selectedProductId,
                    test_configuration_id: selectedTestConfigId,
                })
            );

            setSessionLoading(true);
        },
        [websocket, salespersonInput, conversationHistory, currentCustomerQuestion, selectedProductId, selectedTestConfigId]
    );

    const endSession = useCallback(() => {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) {
            return;
        }

        websocket.send(
            JSON.stringify({
                type: 'end_session',
                history: conversationHistory,
                last_question: currentCustomerQuestion,
                answer: salespersonInput,
                product_id: selectedProductId,
                test_configuration_id: selectedTestConfigId,
            })
        );

        setSessionLoading(true);
    }, [websocket, conversationHistory, currentCustomerQuestion, salespersonInput, selectedProductId, selectedTestConfigId]);

    useEffect(() => {
        if (!isSessionActive) {
            cleanupWebSocket();
            return;
        }

        connectWebSocket();
        return cleanupWebSocket;
    }, [isSessionActive, selectedProductId, selectedTestConfigId, connectWebSocket, cleanupWebSocket]);

    return {
        websocket,
        sessionLoading,
        sessionError,
        conversationHistory,
        currentCustomerQuestion,
        evaluationResults,
        salespersonInput,
        setSalespersonInput,
        sendAnswer,
        endSession,
    };
};