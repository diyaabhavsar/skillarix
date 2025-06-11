import { Product, TestConfiguration, ConversationPair } from "@/types/practice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  products: Product[];
  testConfigurations: TestConfiguration[];
  selectedProductId: string;
  selectedTestConfigId: string;
  conversationHistory: ConversationPair[];
  sessionLoading: boolean;
  salespersonInput: string;
  isRecording: boolean;
  onSalespersonInputChange: (value: string) => void;
  onVoiceInput: () => void;
  onSendResponse: () => void;
  canEndSession: boolean;
  onEndSession: () => void;
}

const ChatInterface = ({
  products,
  testConfigurations,
  selectedProductId,
  selectedTestConfigId,
  conversationHistory,
  sessionLoading,
  salespersonInput,
  isRecording,
  onSalespersonInputChange,
  onVoiceInput,
  onSendResponse,
  canEndSession,
  onEndSession,
}: ChatInterfaceProps) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Improved scroll handler with smooth behavior
  const scrollToBottom = useCallback((smooth = true) => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Scroll on new messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [conversationHistory, sessionLoading, scrollToBottom]);

  // Initial scroll without animation
  useEffect(() => {
    scrollToBottom(false);
  }, []);

  return (
    <div className="flex flex-col h-[100vh]">
      {/* Messages Area - Scrollable Container */}
      <div ref={chatContainerRef} className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
          <div className="min-h-full pb-32">
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
              {/* Message History */}
              <AnimatePresence mode="popLayout" initial={false}>
                {conversationHistory.map((pair, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Customer Message */}
                    <div className="flex items-start gap-2">
                      <div className="flex-1 max-w-[90%] md:max-w-[85%]">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-blue-600 px-2">
                            Customer
                          </span>
                          <div className="bg-white rounded-2xl rounded-tl-none px-6 py-4 shadow-sm">
                            {pair.visitor_text}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Salesperson Message */}
                    {pair.salesperson_text && (
                      <div className="flex items-start justify-end gap-2">
                        <div className="flex-1 max-w-[90%] md:max-w-[85%]">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-medium text-green-600 px-2">
                              You
                            </span>
                            <div className="bg-green-50 rounded-2xl rounded-tr-none px-6 py-4 shadow-sm">
                              {pair.salesperson_text}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading Indicator */}
              {sessionLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-center"
                >
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Invisible element for scroll anchoring */}
              <div ref={bottomRef} className="h-0 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Input Area - No scroll */}
      <div className="w-full bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Textarea
                value={salespersonInput}
                onChange={(e) => onSalespersonInputChange(e.target.value)}
                placeholder="Type your response here..."
                disabled={sessionLoading}
                className="w-full resize-none rounded-xl border-gray-200 
                         focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[100px]"
                rows={3}
              />
            </div>

            {/* Voice Input Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onVoiceInput}
              className={cn(
                "rounded-full w-10 h-10 flex-shrink-0",
                isRecording
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : "hover:bg-gray-100"
              )}
            >
              {isRecording ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-4 gap-3">
            <Button
              variant="outline"
              onClick={onEndSession}
              disabled={!canEndSession || sessionLoading}
              className="px-6 rounded-xl hover:bg-gray-100"
            >
              End Session
            </Button>
            <Button
              onClick={onSendResponse}
              disabled={sessionLoading || !salespersonInput.trim()}
              className="bg-blue-600 text-white rounded-xl hover:bg-blue-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                        shadow-sm hover:shadow-md transition-all duration-200"
            >
              {sessionLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending...</span>
                </span>
              ) : (
                "Send Response"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
