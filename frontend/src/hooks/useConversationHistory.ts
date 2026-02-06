import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { api } from "@/utils/api";
import {
  ConversationEvaluation,
  ConversationsResponse,
} from "@/types/conversations";

// ---- Hook ----
export function useConversationHistory() {
  const [conversations, setConversations] =
    useState<ConversationsResponse | null>(null);
  const [currentConversation, setCurrentConversation] =
    useState<ConversationEvaluation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const cache = useRef<Map<string, ConversationsResponse>>(new Map());
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const processedConversations = useMemo(
    () => conversations?.data ?? [],
    [conversations]
  );

  const handleError = (err: unknown, fallbackMsg: string) => {
    const error = err instanceof Error ? err : new Error(fallbackMsg);
    setError(error);
    console.error(error);
    return error;
  };

  const fetchConversations = useCallback(
    async (page = 1, limit = 10, forceRefresh = false): Promise<ConversationsResponse> => {
      const cacheKey = `${limit}-${page}`;

      // Return from cache if exists and not forced
      if (!forceRefresh && cache.current.has(cacheKey)) {
        const cached = cache.current.get(cacheKey)!;
        setConversations(cached);
        return cached;
      }

      // Clear any existing debounce timer
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      return new Promise<ConversationsResponse>((resolve, reject) => {
        debounceTimer.current = setTimeout(async () => {
          try {
            setLoading(true);
            const response = await api.get<ConversationsResponse>(
              `/conversations?page=${page}&limit=${limit}`
            );

            // Update state and cache
            setConversations(response);
            cache.current.set(cacheKey, response);

            // Cleanup old cache entries (keep latest 5)
            if (cache.current.size > 5) {
              const keys = Array.from(cache.current.keys());
              cache.current.delete(keys[0]);
            }

            setError(null);
            resolve(response);
          } catch (err) {
            reject(handleError(err, "Failed to fetch conversations"));
          } finally {
            setLoading(false);
          }
        }, 150); // Debounce delay
      });
    },
    []
  );

  const fetchConversationById = useCallback(
    async (productId: string, conversationId: string) => {
      try {
        setLoading(true);
        const response = await api.get<ConversationEvaluation>(
          `/conversations/details/${productId}/`
        );
        setCurrentConversation(response);
        setError(null);
      } catch (err) {
        handleError(err, "Failed to load conversation details");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      cache.current.clear();
    };
  }, []);

  return {
    conversations,
    processedConversations,
    currentConversation,
    loading,
    error,
    fetchConversations,
    fetchConversationById,
  };
}
