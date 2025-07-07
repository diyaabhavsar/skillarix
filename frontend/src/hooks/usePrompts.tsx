import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { api } from "@/utils/api";

// Define the Prompt interface based on your API structure
interface PromptCondition {
  condition: string;
  prompt: string;
}

export interface Prompt {
  _id: string;
  title: string;
  prompt: PromptCondition[];
  createdAt?: string;
  updatedAt?: string;
}

// Define API response types
interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

// Define a constant for the fixed prompt ID to avoid repetition
const FIXED_PROMPT_ID = "686b5d6a7974bf88bcdfbd64";

export const usePrompts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get prompt by ID - always uses the fixed ID regardless of what's passed
  const getPromptById = useCallback(
    async (id: string): Promise<Prompt | null> => {
      setLoading(true);
      setError(null);

      try {
        // Always use the fixed ID for the API call
        const response = await api.get<Prompt>(`/prompts/${FIXED_PROMPT_ID}`);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred fetching the prompt";
        setError(errorMessage);
        console.error("Error fetching prompt:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update an existing prompt
  const updatePrompt = useCallback(
    async (
      id: string,
      title: string,
      promptConditions: PromptCondition[]
    ): Promise<Prompt | null> => {
      setLoading(true);
      setError(null);

      try {
        const payload = {
          title,
          prompt: promptConditions,
        };

        const response = await api.put<typeof payload, ApiResponse<Prompt>>(
          `/prompts/${id}`,
          payload
        );

        // Use the message from the API response if available, or fallback to a default message
        const successMessage =
          response.message || "Prompt updated successfully";
        toast.success(successMessage);

        return response.data || null;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An error occurred updating the prompt";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error updating prompt:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Convert markdown-style prompt to API format - memoized to prevent unnecessary re-renders
  const convertPromptToApiFormat = useCallback(
    (promptText: string): PromptCondition[] => {
      return [
        {
          condition: "main",
          prompt: promptText,
        },
      ];
    },
    []
  );

  // Convert API format to markdown-style prompt - memoized to prevent unnecessary re-renders
  const convertApiFormatToPrompt = useCallback(
    (conditions: PromptCondition[]): string => {
      const mainCondition = conditions.find((c) => c.condition === "main");
      const promptText = mainCondition
        ? mainCondition.prompt
        : conditions[0]?.prompt || "";
      return promptText;
    },
    []
  );

  // Expose the fixed prompt ID for use in components
  const fixedPromptId = useMemo(() => FIXED_PROMPT_ID, []);

  return {
    loading,
    error,
    getPromptById,
    updatePrompt,
    convertPromptToApiFormat,
    convertApiFormatToPrompt,
    fixedPromptId,
  };
};
