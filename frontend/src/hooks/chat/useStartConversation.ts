import { useCallback, useEffect } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import useElevenLabsConfig from "@/hooks/useElevenLabs";
import { env } from "@/config/env";
import { toast } from "sonner";

// Create a helper function outside the hook to refresh the prompt
async function refreshPromptBeforeConversation(elevenLabsConfig: any): Promise<boolean> {
  try {
    const success = await elevenLabsConfig.refreshPrompt();
    return success;
  } catch (error) {
    console.error("Error refreshing prompt:", error);
    return false;
  }
}

export function useStartConversation(
  selectedProductId: string, 
  selectedTestConfigId: string, 
  conversation: any, 
  setConversationId: (id: string) => void, 
  setIsStarting: (b: boolean) => void, 
  setErrorMessage: (msg: string) => void
) {
  const { getProductById } = useProducts();
  const { fetchTestById } = useTests();
  const elevenLabs = useElevenLabsConfig();
  const agent_id = env.AGENT_ID;
  
  // Instead of having state in the hook, we'll handle this in the callback function

  // Use useEffect instead of immediate function execution to initialize
  useEffect(() => {
    refreshPromptBeforeConversation(elevenLabs);
  }, [elevenLabs]);
  
  return useCallback(async () => {
    const fetchedProduct = getProductById(selectedProductId);
    const fetchedTest = fetchTestById(selectedTestConfigId);
    setIsStarting(true);
    
    const dynamicBody = {
      visitorPersona: JSON.stringify(fetchedTest.visitorPersona),
      product: JSON.stringify({
        content: fetchedProduct.content,
        description: fetchedProduct.description,
      }),
    };
    
    try {
      // Try to refresh the prompt again right before starting
      try {
        const refreshSuccess = await refreshPromptBeforeConversation(elevenLabs);
        if (!refreshSuccess) {
          toast.warning("Using cached prompt template. Prompt drawer changes may not be reflected.", {
            duration: 5000,
            id: "prompt-cache-warning"
          });
        }
      } catch (error) {
        console.error("Error refreshing prompt before conversation start:", error);
      }
      
      // Update the agent config with the prompt
      await elevenLabs.updateAgentConfig(dynamicBody);
      
      // Start the conversation
      const conversation_id = await conversation.startSession({ agentId: agent_id });
      setConversationId(conversation_id);
      
      toast.success("Conversation started with the latest prompt", {
        duration: 3000
      });
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    } finally {
      setIsStarting(false);
    }
  }, [
    selectedProductId, 
    selectedTestConfigId, 
    conversation, 
    setConversationId, 
    setIsStarting, 
    setErrorMessage, 
    getProductById, 
    fetchTestById, 
    elevenLabs, 
    agent_id
  ]);
}
