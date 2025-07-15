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
    async (titleParam?: string): Promise<Prompt | null> => {
      setLoading(true);
      setError(null);

      try {
        // Use the passed title parameter, or fall back to environment variable
        const titleToUse = titleParam || PROMPT_TITLE;
        
        if (!titleToUse) {
          throw new Error("No prompt title provided and no default title configured");
        }
        
        const encodedTitle = encodeURIComponent(titleToUse);
        const response = await api.get<Prompt>(`/prompts?title=${encodedTitle}`);
        
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

        // Make API call to update the prompt
        const response = await api.put<typeof promptPayload, ApiResponse<Prompt>>(
          `/prompts/${promptId}`,
          promptPayload
        );

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
      // Preserve special placeholders like {{Visitor_persona}} and {{Product}}
      return [
        {
          condition: "main",
          prompt: promptText,
        },
      ];
    },
    []
  );

  // Convert API format to markdown-style prompt - enhanced to handle multiple conditions properly
  const convertApiFormatToPrompt = useCallback(
    (conditions: PromptCondition[]): string => {
      if (!conditions || conditions.length === 0) {
        return "";
      }

      const mainCondition = conditions.find((c) => c.condition === "main");
      
      if (mainCondition) {
        return mainCondition.prompt;
      }

      const priorityConditions = ["default", "base", "primary"];
      for (const priority of priorityConditions) {
        const condition = conditions.find((c) => c.condition === priority);
        if (condition) {
          return condition.prompt;
        }
      }

      const firstCondition = conditions[0];
      if (firstCondition) {
        return firstCondition.prompt;
      }

      return "";
    },
    []
  );

  // Create a state to store the prompt ID we get from the API
  const [promptId, setPromptId] = useState<string>("");
  
  // Expose the prompt ID for use in components
  const fixedPromptId = useMemo(() => promptId, [promptId]);

  // Transcript update function to call PUT API
  const updateTranscript = useCallback(
    async (
      conversationId: string,
      transcriptData: Array<{ source: string; text: string }>,
      testConfigId: string,
      productId: string
    ): Promise<{ success: boolean; message: string; data?: any }> => {
      setLoading(true);
      setError(null);

      try {
        const requestData = {
          test_config_id_str: testConfigId,
          product_id_str: productId,
          transcript: transcriptData,
        };

        const response = await api.put<typeof requestData, any>(
          `/elevenlabs/transcript/${conversationId}`,
          requestData
        );

        return {
          success: true,
          message: response.message || "Transcript updated successfully",
          data: response,
        };
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update transcript";
        setError(errorMessage);
        console.error("Error updating transcript:", err);
        
        return {
          success: false,
          message: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    loading,
    error,
    getPromptById,
    updatePrompt,
    updateTranscript,
    convertPromptToApiFormat,
    convertApiFormatToPrompt,
    fixedPromptId,
    setPromptId,
  };
};
