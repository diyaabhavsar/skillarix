
import { useCallback } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import { env } from "@/config/env";
import { toast } from "sonner";
import { api } from "@/utils/api";

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
  const agent_id = env.AGENT_ID;

  return useCallback(async () => {
    const fetchedProduct = getProductById(selectedProductId);
    const fetchedTest = fetchTestById(selectedTestConfigId);
    setIsStarting(true);

    if (!fetchedProduct || !fetchedTest) {
      toast.error("Missing product or test configuration");
      setIsStarting(false);
      return;
    }

    console.log("Starting Conversation with Backend Agent Update:", {
      product_name: fetchedProduct.name,
      test_config: fetchedTest.name
    });

    try {
      // 1. Update the agent configuration via our backend
      // This will generate the dynamic prompt and update ElevenLabs
      await api.post("/elevenlabs/agent/update", {
        test_config_id: selectedTestConfigId
        // agent_id: agent_id // Let backend use its configured default to avoid mismatch
      });

      toast.success("Agent configured with dynamic persona");

      // 2. Start the conversation
      const conversation_id = await conversation.startSession({ agentId: agent_id });
      setConversationId(conversation_id);

      toast.success("Conversation started");
    } catch (error: any) {
      const msg = error.response?.data?.detail || "Failed to start conversation";
      setErrorMessage(msg);
      console.error("Error starting conversation:", error);
      toast.error(msg);
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
    agent_id
  ]);
}
