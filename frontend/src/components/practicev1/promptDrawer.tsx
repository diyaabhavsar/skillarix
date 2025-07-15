import React, { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePrompts } from "@/hooks/usePrompts";

interface PromptDrawerProps {
  open: boolean;
  onClose: () => void;
}
const DRAWER_WIDTH = 400;

const PromptDrawer: React.FC<PromptDrawerProps> = ({ open, onClose }) => {
  const {
    getPromptById,
    updatePrompt,
    convertPromptToApiFormat,
    convertApiFormatToPrompt,
    fixedPromptId,
    setPromptId: setGlobalPromptId
  } = usePrompts();
  const [promptInfo, setPromptInfo] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [localPromptId, setLocalPromptId] = useState<string | null>(null);
  const [promptTitle, setPromptTitle] = useState<string>(
    "ElevenLabs Agent System"
  );
  const [loadingPrompt, setLoadingPrompt] = useState(false);

  // Load prompt from API by title
  const loadPrompt = useCallback(async () => {
    // Set local loading state to true
    setLoadingPrompt(true);

    try {
      // Get the prompt by title
      const prompt = await getPromptById("");
      if (prompt) {
        // Store both locally and globally
        setLocalPromptId(prompt._id);
        setGlobalPromptId(prompt._id);
        
        setPromptTitle(prompt.title);
        
        // Convert the API format to prompt text while preserving placeholders
        const promptText = convertApiFormatToPrompt(prompt.prompt);
        
          // Simply set the prompt text without any placeholder handling
        setPromptInfo(promptText);
      } else {
        toast.error("Could not load the main prompt");
      }
    } catch (error) {
      console.error("Error loading prompt:", error);
      toast.error("Failed to load prompt");
    } finally {
      // Always set loading state to false when done
      setLoadingPrompt(false);
    }
  }, [getPromptById, convertApiFormatToPrompt, fixedPromptId]);

  // Load prompt when drawer is opened or when dependencies change
  useEffect(() => {
    if (open) {
      loadPrompt();
    }
  }, [open, loadPrompt]);

  const handleApplyPrompt = async () => {
    if (!promptTitle.trim()) {
      toast.error("Please enter a prompt title");
      return;
    }

    setIsUpdating(true);

    try {
      // Format the prompt data for the API
      const promptContent = convertPromptToApiFormat(promptInfo);

      if (!localPromptId) {
        throw new Error("No prompt ID found. Please reload the page.");
      }

      // Update the prompt with new information using the dynamically loaded ID
      const result = await updatePrompt(
        localPromptId,
        promptTitle,
        promptContent
      );

      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to update prompt");
      }

      // Make sure the global prompt ID is updated
      setGlobalPromptId(localPromptId);

      // Reload the prompt to display the updated data
      await loadPrompt();
      
      // Use the success message from the API in the toast notification
      toast.success(`${result.message}. Changes will apply to new conversations.`, {
        duration: 5000,
        id: "prompt-updated-notice"
      });
      
      // Toast message from API is already handled by updatePrompt function
    } catch (error) {
      console.error("❌ Error updating prompt:", error);
      // Show a single toast error message
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update prompt";
      toast.error(errorMessage, {
        duration: 5000,
        id: "prompt-update-error"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`transition-all duration-300 h-full bg-white border-r shadow-lg flex flex-col relative`}
      style={{
        width: open ? DRAWER_WIDTH : 0,
        minWidth: open ? 300 : 0,
      }}
    >
      {/* Header and close button */}
      {open && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white sticky top-0 z-10">
          <span className="font-semibold text-lg">Prompt Information</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Prompt Content */}
      {open && (
        <div className="overflow-y-auto h-[calc(100vh-3.5rem)] p-4">
          {loadingPrompt ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse text-center">
                <div className="text-sm text-gray-500 mt-2">
                  Loading prompt...
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow p-4 space-y-4">
              <div className="mb-4">
                <label
                  htmlFor="promptTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prompt Title
                </label>
                <input
                  id="promptTitle"
                  type="text"
                  className="w-full p-2 rounded-md border bg-white"
                  value={promptTitle}
                  onChange={(e) => setPromptTitle(e.target.value)}
                  placeholder="Enter prompt title..."
                />
              </div>

              <label
                htmlFor="promptContent"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Prompt Content
              </label>
              <div className="relative">
                <textarea
                  id="promptContent"
                  className="w-full h-[calc(100vh-16rem)] p-3 rounded-md border bg-white font-mono"
                  value={promptInfo}
                  spellCheck="false"
                  onChange={(e) => {
                    setPromptInfo(e.target.value);
                  }}
                  placeholder="Enter prompt information..."
                  style={{ resize: "none" }}
                />
              </div>

              <div className="flex items-center justify-center mt-4 w-full">
                <Button
                  className="w-full"
                  onClick={handleApplyPrompt}
                  disabled={isUpdating || loadingPrompt}
                  variant="default"
                >
                  {isUpdating ? "Saving..." : "Apply Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PromptDrawer;
