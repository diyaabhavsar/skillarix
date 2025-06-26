import { useState, useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import useElevenLabsConfig from "@/hooks/useElevenLabs";
import { env } from "@/config/env";

export function useStartConversation(selectedProductId: string, selectedTestConfigId: string, conversation: any, setConversationId: (id: string) => void, setIsStarting: (b: boolean) => void, setErrorMessage: (msg: string) => void) {
  const { fetchProductById } = useProducts();
  const { fetchTestById } = useTests();
  const elevenLabs = useElevenLabsConfig();
  const agent_id = env.AGENT_ID;

  return useCallback(async () => {
    const fetchedProduct = fetchProductById(selectedProductId);
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
      await elevenLabs.updateAgentConfig(dynamicBody);
      const conversation_id = await conversation.startSession({ agentId: agent_id });
      setConversationId(conversation_id);
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    } finally {
      setIsStarting(false);
    }
  }, [selectedProductId, selectedTestConfigId, conversation, setConversationId, setIsStarting, setErrorMessage, fetchProductById, fetchTestById, elevenLabs, agent_id]);
}
