import { useNavigate, useLocation } from "react-router-dom";
import SessionSetupForm from "@/components/practice/SessionSetupForm";
import { usePracticeSession } from "@/hooks/usePracticeSession";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SessionSetupPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isAttemptingToLeave, setIsAttemptingToLeave] = useState(false);

  const {
    categories,
    products,
    testConfigurations,
    selectedCategoryId,
    selectedProductId,
    selectedTestConfigId,
    isLoading: isSelectionLoading,
    setSelectedCategoryId,
    setSelectedProductId,
    setSelectedTestConfigId,
    isSelectionValid,
  } = usePracticeSession();

  // Prevent navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setIsAttemptingToLeave(true);
      if (
        window.confirm(
          "Are you sure you want to leave? Any progress will be lost."
        )
      ) {
        navigate("/practice");
      } else {
        window.history.pushState(null, "", location.pathname);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname]);

  const handleStartSession = () => {
    if (!isSelectionValid || isSelectionLoading) {
      setSessionError(
        "Please ensure all selections are valid before starting."
      );
      return;
    }

    try {
      // Save session details in localStorage for chat page
      localStorage.setItem(
        "currentSession",
        JSON.stringify({
          categoryId: selectedCategoryId,
          productId: selectedProductId,
          testConfigId: selectedTestConfigId,
          timestamp: new Date().toISOString(),
        })
      );

      // Navigate to chat page
      navigate("/session/chat");
    } catch (error) {
      setSessionError("Failed to start session. Please try again.");
      console.error("Session start error:", error);
    }
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
                Are you sure you want to leave?
              </h2>
              <p className="text-muted-foreground mb-6">
                Your assessment setup progress will be lost.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setIsAttemptingToLeave(false)}
                  className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Stay
                </button>
                <button
                  onClick={() => navigate("/practice")}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Leave
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main
        className={cn(
          "flex-1 container max-w-6xl mx-auto px-4 py-8",
          "relative z-10"
        )}
      >
        <div className="mb-8 flex items-center gap-4 relative">
          <Button
            onClick={() => navigate(-1)}
            size="icon"
            variant="ghost"
            className="absolute left-0 top-1/2 -translate-y-1/2"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 flex flex-col items-center">
            <h1 className="text-3xl font-bold text-center">
              Setup Assessment Session
            </h1>
            <p className="text-muted-foreground text-center">
              Select category, product, and scenario to begin your assessment
            </p>
          </div>
        </div>

        <SessionSetupForm
          categories={categories}
          products={products}
          testConfigurations={testConfigurations}
          selectedCategoryId={selectedCategoryId}
          selectedProductId={selectedProductId}
          selectedTestConfigId={selectedTestConfigId}
          isSelectionLoading={isSelectionLoading}
          setSelectedCategoryId={setSelectedCategoryId}
          setSelectedProductId={setSelectedProductId}
          setSelectedTestConfigId={setSelectedTestConfigId}
          onStartSession={handleStartSession}
          isStartButtonDisabled={!isSelectionValid || isSelectionLoading}
          sessionError={sessionError}
        />
      </main>
    </div>
  );
};

export default SessionSetupPage;
