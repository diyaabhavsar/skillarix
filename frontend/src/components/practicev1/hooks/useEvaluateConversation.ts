import { useCallback } from "react";
import useElevenLabsTranscript from "@/hooks/useElevenLabsTranscript";

export function useEvaluateConversation(selectedProductId: string, selectedTestConfigId: string, messagesRef: React.RefObject<any>, setIsEvaluating: (b: boolean) => void, setErrorMessage: (msg: string) => void, onEndSession: () => void) {
  const { postTranscript } = useElevenLabsTranscript();
  return useCallback(async () => {
    setIsEvaluating(true);
    const finalMessages = messagesRef.current;
    try {
      await postTranscript({
        product_id_str: selectedProductId,
        test_config_id_str: selectedTestConfigId,
        transcript: finalMessages,
      });
      onEndSession();
    } catch (error) {
      setErrorMessage("Failed to evaluate conversation");
      console.error("Error evaluating conversation:", error);
    } finally {
      setIsEvaluating(false);
    }
  }, [selectedProductId, selectedTestConfigId, messagesRef, setIsEvaluating, setErrorMessage, onEndSession, postTranscript]);
}
