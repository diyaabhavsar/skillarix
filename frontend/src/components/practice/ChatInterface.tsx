import { Product, TestConfiguration, ConversationPair } from "@/types/practice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mic, MicOff } from "lucide-react";

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
  onEndSession,
}: ChatInterfaceProps) => {
  return (
    <div className="flex flex-col h-full gap-6">
      {/* Session Info Header */}
      <div className="bg-muted/30 rounded-lg p-4">
        <h2 className="font-semibold text-xl mb-2">Active Practice Session</h2>
        {selectedProductId && (
          <p className="text-sm text-muted-foreground">
            Product:{" "}
            {products.find((p) => p.id === selectedProductId)?.name || "N/A"} |
            Scenario:{" "}
            {testConfigurations.find((c) => c.id === selectedTestConfigId)
              ?.name || "N/A"}
          </p>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-[calc(100vh-400px)] border rounded-lg">
          <div className="p-6 space-y-6">
            {conversationHistory.map((pair, index) => (
              <div key={index} className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="font-semibold text-blue-700 mb-2">
                    Customer:
                  </div>
                  <div className="text-blue-900">{pair.visitor_text}</div>
                </div>
                {pair.salesperson_text && (
                  <div className="bg-green-50 rounded-lg p-4 ml-8">
                    <div className="font-semibold text-green-700 mb-2">
                      Salesperson:
                    </div>
                    <div className="text-green-900">
                      {pair.salesperson_text}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {sessionLoading && (
              <div className="text-center py-4 text-muted-foreground">
                AI is thinking...
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="border-t pt-4 bg-background sticky bottom-0">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="salesperson-input" className="font-medium">
            Your Response
          </Label>
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="icon"
            onClick={onVoiceInput}
            className="h-8 w-8"
            type="button"
          >
            {isRecording ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Textarea
          id="salesperson-input"
          placeholder="Type your response here..."
          value={salespersonInput}
          onChange={(e) => onSalespersonInputChange(e.target.value)}
          disabled={sessionLoading}
          rows={3}
          className="min-h-[100px] mb-4"
        />
        <div className="flex justify-between gap-4">
          <Button
            onClick={onSendResponse}
            disabled={sessionLoading || !salespersonInput.trim()}
            className="flex-1"
            size="lg"
          >
            {sessionLoading ? "Sending..." : "Send Response"}
          </Button>
          <Button
            variant="outline"
            onClick={onEndSession}
            disabled={sessionLoading || !conversationHistory.length || (conversationHistory.length > 0 && !conversationHistory[conversationHistory.length - 1].salesperson_text && !salespersonInput.trim())}
            size="lg"
          >
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
