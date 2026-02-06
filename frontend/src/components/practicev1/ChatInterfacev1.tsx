import React, { useState, useRef } from "react";
import { useConversation } from "@elevenlabs/react";
import { Mic, MicOff, Loader2 } from "lucide-react";
// Use public URL path instead of importing
const chatbotEmptyState = "/chatbot-empty-state.svg";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ChatHeading from "./ChatHeading";
import ChatMessage from "./ChatMessage";
import ListeningBars from "./ListeningBars";
import "../../styles/ChatInterfacev1.css";
import { useAutoScroll } from "@/hooks/chat/useAutoScroll";
import { useStartConversation } from "@/hooks/chat/useStartConversation";
import { useEvaluateConversation } from "@/hooks/chat/useEvaluateConversation";
import LeftDrawer from "./LeftDrawer";
import PromptDrawer from "./promptDrawer";
import { getSessionContext } from "./session";
import { Button } from "../ui/button";
import { useLatestRef } from "@/hooks/chat/useLatestRef";
import { toast } from "sonner";

interface VoiceChatProps {
  onEndSession: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ onEndSession }) => {
  const [hasPermission, setHasPermission] = useState(false);
  // Keeping setConversationId but removing the unused state variable
  const [, setConversationId] = useState<string>("");
  // Using _ prefix for errorMessage since it's used in setErrorMessage but not directly read
  const [_errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<{ text: string; source: string }[]>(
    []
  );
  const [isStarting, setIsStarting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [promptDrawerOpen, setPromptDrawerOpen] = useState(false);
  const [backDisabled, setBackDisabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const { productId: selectedProductId, testConfigId: selectedTestConfigId } =
    getSessionContext();

  // Conversation logic
  const conversation = useConversation({
    onConnect: () => console.log("Connected to ElevenLabs"),
    onDisconnect: async () => {
      await evaluateConversation();
    },
    onMessage: (message) => {
      setMessages((prev) => [
        ...prev,
        { text: message.message, source: message.source },
      ]);
    },
    onError: (error: string | Error) => {
      setErrorMessage(typeof error === "string" ? error : error.message);
      console.error("Error:", error);
    },
  });
  const { status, isSpeaking } = conversation;

  // Custom hooks for logic
  useAutoScroll(messages, chatContainerRef);
  const messagesRef = useLatestRef(messages);
  const startConversation = useStartConversation(
    selectedProductId,
    selectedTestConfigId,
    conversation,
    setConversationId,
    setIsStarting,
    setErrorMessage
  );
  const evaluateConversation = useEvaluateConversation(
    selectedProductId,
    selectedTestConfigId,
    messagesRef,
    setIsEvaluating,
    setErrorMessage,
    onEndSession
  );

  // Microphone permission
  React.useEffect(() => {
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

  const handleEndConversation = async () => {
    try {
      setIsEnding(true);
      await conversation.endSession();
    } catch (error) {
      setIsEnding(false);
      setIsEvaluating(false);
      setErrorMessage("Failed to end conversation");
      console.error("Error ending conversation:", error);
    }
  };

  const handleStartConversation = async () => {
    setBackDisabled(true);
    await startConversation();
  };

  const handleToggleLeftDrawer = () => {
    // If drawer is already open, close it. Otherwise open it and close the prompt drawer
    if (drawerOpen) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
      setPromptDrawerOpen(false);
    }
  };

  const handleTogglePromptDrawer = () => {
    // If prompt drawer is already open, close it. Otherwise open it and close the left drawer
    if (promptDrawerOpen) {
      setPromptDrawerOpen(false);

      // Let the user know that changes will be applied to new conversations
      toast.info("Prompt changes will be applied to new conversations", {
        duration: 3000,
        id: "prompt-drawer-closed"
      });
    } else {
      setPromptDrawerOpen(true);
      setDrawerOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-row w-full h-full">
        {/* Left Drawer - Test Configuration */}
        <div
          className={`transition-all duration-300 h-full ${drawerOpen ? "w-[400px] min-w-[300px]" : "w-0 min-w-0"
            } relative`}
          style={{ flexShrink: 0 }}
        >
          <LeftDrawer
            open={drawerOpen}
            onClose={handleToggleLeftDrawer}
            testId={selectedTestConfigId}
          />
        </div>
        {/* Prompt Drawer */}
        <div
          className={`transition-all duration-300 h-full ${promptDrawerOpen ? "w-[400px] min-w-[300px]" : "w-0 min-w-0"
            } relative`}
          style={{ flexShrink: 0 }}
        >
          <PromptDrawer
            open={promptDrawerOpen}
            onClose={handleTogglePromptDrawer}
          />
        </div>
        {/* Chat Area */}
        <div className="flex-1 h-full">
          <div className="flex flex-col w-full h-full">
            <ChatHeading
              productId={selectedProductId}
              testId={selectedTestConfigId}
              onBack={() => window.history.back()}
              disableBack={backDisabled}
              onToggleDrawer={handleTogglePromptDrawer}
              onLeftDrawer={handleToggleLeftDrawer}
            />
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
                        <ChatMessage
                          key={idx}
                          text={msg.text}
                          source={msg.source}
                        />
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
                          <ListeningBars />
                          <span className="ml-2">
                            {isSpeaking ? "AI is speaking..." : "Listening..."}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={handleEndConversation}
                        disabled={isEnding}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-lg text-white text-lg font-semibold bg-red-500 hover:bg-red-600 transition focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isEnding ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Ending Session...
                          </>
                        ) : (
                          <>
                            <MicOff className="mr-2 h-5 w-5" />
                            End Conversation
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <Button
                      onClick={handleStartConversation}
                      disabled={!hasPermission || isStarting}
                      className="w-full flex items-center justify-center gap-2 py-6 rounded-lg text-white text-lg font-semibold"
                    >
                      <Mic className="mr-2 h-5 w-5" />
                      {isStarting
                        ? "AI agent is starting..."
                        : "Start Assessment"}
                    </Button>
                  )}
                </div>
                <div className="text-center text-sm mt-4">
                  {/* {_errorMessage && <p className="text-red-500">{_errorMessage}</p>} */}
                  {!hasPermission && (
                    <p className="text-yellow-600">
                      Please allow microphone access to use voice chat
                    </p>
                  )}
                </div>
              </div>
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
    </>
  );
};

export default VoiceChat;
