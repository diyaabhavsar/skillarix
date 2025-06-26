import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { capitalizeEvaluationTitle } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import VoiceChat from "@/components/practicev1/ChatInterfacev1";

interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface EvaluationResults {
  complete: string;
  additional?: string;
}

const ChatSessionPage = () => {
  // Navigation and context
  const navigate = useNavigate();

  // UI state
  const [isAttemptingToLeave, setIsAttemptingToLeave] = useState(false);

  const [evaluationResults, setEvaluationResults] =
    useState<EvaluationResults | null>(null);

  // Core utility functions

  const handleEndSession = () => {
    navigate("/Practice");
  };

  return (
    <div className="fixed inset-0 bg-background min-h-screen flex flex-col">
      <AnimatePresence>
        {isAttemptingToLeave && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4"
            >
              <h2 className="text-xl font-semibold mb-4">
                Assessment in Progress
              </h2>
              <p className="text-muted-foreground mb-6">
                You cannot leave during an active assessment. Please complete or
                end the session first.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsAttemptingToLeave(false)}
                  className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Continue Assessment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <VoiceChat onEndSession={handleEndSession} />

      {/* Session Complete Dialog */}
      <Dialog
        open={!!evaluationResults}
        onOpenChange={() => setEvaluationResults(null)}
      >
        <DialogContent className="max-w-2xl">
          <h2 className="text-2xl font-semibold mb-4">Session Complete</h2>
          {evaluationResults && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold">
                  {capitalizeEvaluationTitle("Complete Evaluation")}
                </h3>
                <p className="whitespace-pre-wrap">
                  {evaluationResults.complete}
                </p>
              </div>

              {evaluationResults.additional && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h3 className="text-lg font-semibold">
                      {capitalizeEvaluationTitle("Additional Criteria")}
                    </h3>
                    <p className="whitespace-pre-wrap">
                      {evaluationResults.additional}
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatSessionPage;
