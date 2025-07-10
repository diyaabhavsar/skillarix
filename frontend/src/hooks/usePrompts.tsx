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

// Import environment configuration
import { env } from "@/config/env";

// Define the prompt title from environment variables
const PROMPT_TITLE = env.ELEVENLABS_PROMPT_TITLE;

export const usePrompts = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get prompt by title using query parameter
  const getPromptById = useCallback(
    async (_id: string): Promise<Prompt | null> => {
      setLoading(true);
      setError(null);

      try {
        // Use title query parameter instead of ID
        console.log(`Fetching prompt with title: ${PROMPT_TITLE}`);
        const encodedTitle = encodeURIComponent(PROMPT_TITLE);
        const response = await api.get<Prompt>(`/prompts?title=${encodedTitle}`);
        
        console.log("Prompt fetched by title:", response);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to fetch prompt";
        setError(errorMessage);
        console.error("Error fetching prompt:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Update an existing prompt by ID
  const updatePrompt = useCallback(
    async (
      promptId: string,
      promptTitle: string,
      promptContent: PromptCondition[]
    ): Promise<{ data: Prompt | null; success: boolean; message: string }> => {
      setLoading(true);
      setError(null);

      try {
        // Prepare payload for API
        const promptPayload = {
          title: promptTitle,
          prompt: promptContent,
        };

        console.log(`Updating prompt with ID ${promptId}:`, promptPayload);

        // Make API call to update the prompt
        const response = await api.put<typeof promptPayload, ApiResponse<Prompt>>(
          `/prompts/${promptId}`,
          promptPayload
        );

        console.log("API Response:", response);

        // Return both the data and the success message without showing a toast
        // The component will handle toast display
        return {
          data: response.data || null,
          success: true,
          message: response.message || "Prompt updated successfully"
        };
      } catch (err) {
        // Handle error cases
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update prompt";
        setError(errorMessage);
        console.error("Error updating prompt:", err);
        
        // Return failure status with error message
        return {
          data: null,
          success: false,
          message: errorMessage
        };
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
      
      // Ensure special placeholders are preserved
      return promptText;
    },
    []
  );

  // Create a state to store the prompt ID we get from the API
  const [promptId, setPromptId] = useState<string>("");
  
  // Expose the prompt ID for use in components
  const fixedPromptId = useMemo(() => promptId, [promptId]);

  return {
    loading,
    error,
    getPromptById,
    updatePrompt,
    convertPromptToApiFormat,
    convertApiFormatToPrompt,
    fixedPromptId,
    setPromptId,
  };
};
