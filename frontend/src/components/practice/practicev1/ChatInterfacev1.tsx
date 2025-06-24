import React, { useEffect, useRef, useState } from "react";
import { useConversation } from "@elevenlabs/react";
import useElevenLabsConfig from "@/hooks/useElevenLabs";
import useElevenLabsTranscript from "@/hooks/useElevenLabsTranscript";

// UI
import { Mic, MicOff } from "lucide-react";
import chatbotEmptyState from "./chatbot-empty-state.svg";
import { env } from "@/config/env";
import { useProducts } from "@/hooks/useProducts";
import { useTests } from "@/hooks/useTests";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const agent_id = env.AGENT_ID;

interface VoiceChatProps {
  selectedProductId: string | null;
  selectedTestConfigId: string | null;
  sessionLoading: boolean;
  salespersonInput: string;
  onEndSession: () => void;
  canEndSession: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  selectedProductId,
  selectedTestConfigId,
  sessionLoading,
  salespersonInput,
  onEndSession,
  canEndSession,
}) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; source: string }[]>(
    []
  );
  const [isStarting, setIsStarting] = useState(false); // loading state for agent start
  const [isEvaluating, setIsEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const { fetchProductById } = useProducts();
  const { fetchTestById } = useTests();
  // console.log(agent_id)
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
    },
    onMessage: (message) => {
      // message: { text: string, source: 'user' | 'ai' }
      setMessages((prev) => [
        ...prev,
        { text: message.message, source: message.source },
      ]);
      console.log("Received message:", message);
    },
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
      console.error("Error:", error);
    },
  });

  const elevenLabs = useElevenLabsConfig();
  const { status, isSpeaking } = conversation;
  const { postTranscript } = useElevenLabsTranscript();

  useEffect(() => {
    // Request microphone permission on component mount
    const requestMicPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setHasPermission(true);
      } catch (error) {
        setErrorMessage("Microphone access denied");
        console.error("Error accessing microphone:", error);
      }
    };

    requestMicPermission();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);


  const handleStartConversation = async () => {
    const fetchedProduct = fetchProductById(selectedProductId);
    const fetchedTest = fetchTestById(selectedTestConfigId);
    console.log(fetchedProduct, fetchedTest);

    setIsStarting(true);
    const dynamicBody = {
      visitorPersona: JSON.stringify(fetchedTest.visitorPersona),
      product: JSON.stringify({
        content: fetchedProduct.content,
        description: fetchedProduct.description,
      }),
    };
    console.log(dynamicBody);

    try {
      await elevenLabs.updateAgentConfig(dynamicBody); // moved here
      // Replace with your actual agent ID or URL
      const conversation_id = await conversation.startSession({
        agentId: agent_id,
      });
      setConversationId(conversation_id);
      console.log("Started conversation:", conversationId);
    } catch (error) {
      setErrorMessage("Failed to start conversation");
      console.error("Error starting conversation:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndConversation = async () => {
    try {
      await conversation.endSession();
      setMessages([]); // Clear all messages after ending conversation
      setIsEvaluating(true); // Show loading modal
      const convo=messages;
      console.log(convo)
      // Call transcript API
      await postTranscript({
        product_id_str: selectedProductId,
        test_config_id_str: selectedTestConfigId,
        transcript: convo,
      });
      setIsEvaluating(false); // Hide loading modal
      onEndSession();
    } catch (error) {
      setIsEvaluating(false);
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  return (
    <>
      <div className="flex flex-col w-full h-full">
        <div className="flex-1 flex flex-col justify-center items-center px-8 pt-4 w-full h-full">
          <div className="w-full h-full flex flex-col">
            {/* Chat Messages */}
            <div
              ref={chatContainerRef}
              className="bg-gray-50 rounded-lg p-6 flex flex-col gap-2 border w-full"
              style={{
                height: "calc(100vh - 220px)",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <img
                    src={chatbotEmptyState}
                    alt="Chatbot Empty State"
                    width="120"
                    height="120"
                  />
                  <span className="mt-6 text-2xl font-semibold">
                    Start assessment with our AI agent!
                  </span>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.source === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span
                        className={`inline-block px-4 py-2 rounded-lg max-w-[70%] break-words shadow
                          ${
                            msg.source === "user"
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                      >
                        {msg.text}
                      </span>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>
            <div className="flex justify-center gap-4 mt-8 w-full">
              {status === "connected" ? (
                <>
                  <button
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg text-white text-lg font-semibold bg-[#b39ddb] focus:outline-none"
                    disabled
                    style={{ background: "#b39ddb" }}
                  >
                    <span className="relative flex items-center gap-2">
                      <span className="listening-animation flex items-end gap-1">
                        {/* 7 bars, all purple */}
                        <span className="bar bar1"></span>
                        <span className="bar bar2"></span>
                        <span className="bar bar3"></span>
                        <span className="bar bar4"></span>
                        <span className="bar bar5"></span>
                        <span className="bar bar6"></span>
                        <span className="bar bar7"></span>
                      </span>
                      <span className="ml-2">
                        {isSpeaking ? "AI is speaking..." : "Listening..."}
                      </span>
                    </span>
                  </button>
                  <button
                    onClick={handleEndConversation}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-lg text-white text-lg font-semibold bg-red-500 hover:bg-red-600 transition focus:outline-none"
                  >
                    <MicOff className="mr-2 h-5 w-5" />
                    End Conversation
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleStartConversation()}
                  disabled={!hasPermission || isStarting}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-lg text-white text-lg font-semibold bg-blue-500 hover:bg-blue-600 transition focus:outline-none"
                >
                  <Mic className="mr-2 h-5 w-5" />
                  {isStarting ? "AI agent is starting..." : "Start Assessment"}
                </button>
              )}
            </div>
            <div className="text-center text-sm mt-4">
              {/* {errorMessage && <p className="text-red-500">{errorMessage}</p>} */}
              {!hasPermission && (
                <p className="text-yellow-600">
                  Please allow microphone access to use voice chat
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={isEvaluating}>
        <DialogContent className="flex flex-col items-center justify-center">
          <span className="text-lg font-semibold mb-2">
            Your conversation is being evaluated...
          </span>
          <div className="loader mt-4" />
        </DialogContent>
      </Dialog>
      <style>{`
        .loader {
          border: 4px solid #e0e0e0;
          border-top: 4px solid #7c3aed;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

// Add listening bar animation (all purple)
const style = document.createElement("style");
style.innerHTML = `
.listening-animation {
  height: 22px;
}
.bar {
  display: inline-block;
  width: 4px;
  margin: 0 1px;
  border-radius: 2px;
  background: #7c3aed; /* purple-500 */
  animation: barAnim 1.2s infinite;
}
.bar1 {
  height: 8px;
  animation-delay: 0s;
}
.bar2 {
  height: 12px;
  animation-delay: 0.1s;
}
.bar3 {
  height: 16px;
  animation-delay: 0.2s;
}
.bar4 {
  height: 22px;
  animation-delay: 0.3s;
}
.bar5 {
  height: 16px;
  animation-delay: 0.4s;
}
.bar6 {
  height: 12px;
  animation-delay: 0.5s;
}
.bar7 {
  height: 8px;
  animation-delay: 0.6s;
}
@keyframes barAnim {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.7); }
}
`;
document.head.appendChild(style);

export default VoiceChat;
