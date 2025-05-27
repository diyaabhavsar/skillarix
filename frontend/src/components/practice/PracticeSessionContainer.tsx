import EndConversationEvaluation from "./EndConversationEvaluation";
import { mockEndEvaluationData } from "@/data/evaluationData";
import { usePracticeSession } from "@/hooks/usePracticeSession";

const PracticeSessionContainer = () => {
  const {
    chatMessages,
    userResponse,
    isEndEvaluationOpen,
    setIsEndEvaluationOpen,
    handleResponseChange,
    submitResponse,
    handleEndSession,
    handleNewSession,
    waitingForLLM,
  } = usePracticeSession();
  
  return (
    <>
      <div className="flex h-[calc(100vh-10rem)]">
        <div className="flex-1 overflow-y-auto p-4">
          {/* Chat UI */}
          <div className="space-y-4 mb-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-xl ${
                    msg.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {waitingForLLM && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 bg-muted text-foreground max-w-xl opacity-70">
                  Visitor is typing...
                </div>
              </div>
            )}
          </div>
          {/* Input for user response */}
          {!isEndEvaluationOpen && !waitingForLLM && (
            <form
              onSubmit={e => {
                e.preventDefault();
                submitResponse();
              }}
              className="flex gap-2"
            >
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="Type your answer..."
                value={userResponse}
                onChange={e => handleResponseChange(e.target.value)}
                disabled={waitingForLLM}
              />
              <button
                type="submit"
                className="bg-primary text-white px-4 py-2 rounded"
                disabled={!userResponse.trim()}
              >
                Send
              </button>
              <button
                type="button"
                className="ml-2 border px-4 py-2 rounded"
                onClick={handleEndSession}
              >
                End Conversation
              </button>
            </form>
          )}
        </div>
      </div>
      {/* End conversation evaluation */}
      <EndConversationEvaluation
        isOpen={isEndEvaluationOpen}
        onClose={() => setIsEndEvaluationOpen(false)}
        onNewSession={handleNewSession}
        evaluation={mockEndEvaluationData}
      />
    </>
  );
};

export default PracticeSessionContainer;
