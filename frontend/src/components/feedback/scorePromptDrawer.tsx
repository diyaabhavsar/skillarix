import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePrompts } from "@/hooks/usePrompts";
import { env } from "@/config/env";

interface ScoreDrawerPromptProps {
  open: boolean;
  onClose: () => void;
  conversationId?: string;
  testConfigId?: string;
  productId?: string;
  transcriptData?: Array<{ source: string; text: string }>;
}

interface DrawerState {
  promptInfo: string;
  isUpdating: boolean;
  localPromptId: string | null;
  promptTitle: string;
  loadingPrompt: boolean;
  selectedEvaluationType: string;
  isDropdownOpen: boolean;
}

const DRAWER_WIDTH = 400;
const TOAST_DURATION = 5000;

const ScoreDrawerPrompt: React.FC<ScoreDrawerPromptProps> = ({
  open,
  onClose,
  conversationId,
  testConfigId,
  productId,
  transcriptData,
}) => {
  const {
    getPromptById,
    updatePrompt,
    updateTranscript,
    convertPromptToApiFormat,
    convertApiFormatToPrompt,
    setPromptId: setGlobalPromptId,
  } = usePrompts();

  // Memoized evaluation titles parsing from environment variable
  const evaluationTitles = useMemo(() => {
    const titleString = env.VITE_EVALUTION_TITLE || "";
    const cleanString = titleString.replace(/[\[\]]/g, "");
    return cleanString
      .split(",")
      .map((title) => title.trim())
      .filter(Boolean);
  }, []);

  // Consolidated state management
  const [state, setState] = useState<DrawerState>({
    promptInfo: "",
    isUpdating: false,
    localPromptId: null,
    promptTitle: "",
    loadingPrompt: false,
    selectedEvaluationType: "",
    isDropdownOpen: false,
  });

  // Refs for DOM manipulation
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to update state
  const updateState = useCallback((updates: Partial<DrawerState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Load prompt from API by passing selected evaluation type to the hook
  const loadPrompt = useCallback(
    async (evaluationType?: string) => {
      updateState({ loadingPrompt: true });

      try {
        const titleToLoad =
          evaluationType || state.selectedEvaluationType || evaluationTitles[0];

        if (!titleToLoad) {
          throw new Error("No evaluation type available");
        }

        const prompt = await getPromptById(titleToLoad);

        if (!prompt) {
          throw new Error(`Could not load the prompt: ${titleToLoad}`);
        }

        setGlobalPromptId(prompt._id);

        const promptText = convertApiFormatToPrompt(prompt.prompt);
        const cleanedPromptText = promptText.trim();

        updateState({
          localPromptId: prompt._id,
          promptTitle: prompt.title,
          promptInfo: cleanedPromptText || "",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load prompt";
        toast.error(errorMessage);
      } finally {
        updateState({ loadingPrompt: false });
      }
    },
    [
      getPromptById,
      convertApiFormatToPrompt,
      state.selectedEvaluationType,
      evaluationTitles,
      setGlobalPromptId,
      updateState,
    ]
  );

  // Initialize drawer state when opened
  useEffect(() => {
    if (!open) return;

    // Set default selection if not already set
    if (!state.selectedEvaluationType && evaluationTitles.length > 0) {
      updateState({ selectedEvaluationType: evaluationTitles[0] });
    }

    loadPrompt();
  }, [open, loadPrompt, state.selectedEvaluationType, evaluationTitles, updateState]);

  // Handle evaluation type change - optimized with useCallback
  const handleEvaluationTypeChange = useCallback(
    (evaluationType: string) => {
      updateState({
        promptInfo: "",
        promptTitle: "",
        localPromptId: null,
        selectedEvaluationType: evaluationType,
        isDropdownOpen: false,
      });
      loadPrompt(evaluationType);
    },
    [loadPrompt, updateState]
  );

  // Handle prompt info change
  const handlePromptInfoChange = useCallback(
    (value: string) => {
      updateState({ promptInfo: value });
    },
    [updateState]
  );

  // Toggle dropdown
  const toggleDropdown = useCallback(() => {
    updateState({ isDropdownOpen: !state.isDropdownOpen });
  }, [state.isDropdownOpen, updateState]);

  // Optimized click outside handler using ref
  useEffect(() => {
    if (!state.isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        updateState({ isDropdownOpen: false });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state.isDropdownOpen, updateState]);

  // Handle Apply Changes action
  const handleApplyPrompt = useCallback(async () => {
    if (!state.localPromptId) {
      toast.error("No prompt ID found. Please reload the page.");
      return;
    }

    if (!state.promptTitle) {
      toast.error("No prompt title available. Please select an evaluation type.");
      return;
    }

    updateState({ isUpdating: true });

    try {
      // First update the prompt
      const promptContent = convertPromptToApiFormat(state.promptInfo);
      const promptResult = await updatePrompt(
        state.localPromptId,
        state.promptTitle,
        promptContent
      );

      if (!promptResult || !promptResult.success) {
        throw new Error(promptResult?.message || "Failed to update prompt");
      }

      setGlobalPromptId(state.localPromptId);
      await loadPrompt();

      // Then update the transcript if conversation data is available
      if (conversationId && testConfigId && productId && transcriptData) {
        const transcriptResult = await updateTranscript(
          conversationId,
          transcriptData,
          testConfigId,
          productId
        );

        if (!transcriptResult.success) {
          throw new Error(transcriptResult.message || "Failed to update transcript");
        }

        toast.success(
          `${promptResult.message}. Transcript updated and changes will apply to evaluations.`,
          {
            duration: TOAST_DURATION,
            id: "prompt-transcript-updated",
          }
        );
      } else {
        toast.success(
          `${promptResult.message}. Changes will apply to new conversations.`,
          {
            duration: TOAST_DURATION,
            id: "prompt-updated-notice",
          }
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update prompt";
      toast.error(errorMessage, {
        duration: TOAST_DURATION,
        id: "prompt-update-error",
      });
    } finally {
      updateState({ isUpdating: false });
    }
  }, [
    state.promptTitle,
    state.localPromptId,
    state.promptInfo,
    conversationId,
    testConfigId,
    productId,
    transcriptData,
    convertPromptToApiFormat,
    updatePrompt,
    updateTranscript,
    setGlobalPromptId,
    loadPrompt,
    updateState,
  ]);

  return (
    <>
      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full bg-white border-l shadow-2xl flex flex-col z-50 transition-all duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: DRAWER_WIDTH,
        }}
      >
        {/* Header and close button */}
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white sticky top-0 z-10">
          <span className="font-semibold text-lg">
            Evaluation Prompt Information
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Prompt Content */}
        <div className="overflow-y-auto flex-1 p-4">
          {state.loadingPrompt ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse text-center">
                <div className="text-sm text-gray-500 mt-2">
                  Loading prompt...
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg shadow p-4 space-y-4">
              {/* Evaluation Type Dropdown */}
              <div className="mb-4">
                <label
                  htmlFor="evaluationType"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Evaluation Type
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full p-2 rounded-md border bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    onClick={toggleDropdown}
                    aria-haspopup="listbox"
                    aria-expanded={state.isDropdownOpen}
                  >
                    <span className="truncate">
                      {state.selectedEvaluationType || "Select evaluation type..."}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        state.isDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {state.isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {evaluationTitles.map((title, index) => (
                        <button
                          key={`${title}-${index}`}
                          type="button"
                          className={`w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors ${
                            state.selectedEvaluationType === title
                              ? "bg-blue-100 text-blue-900 font-medium"
                              : "text-gray-900"
                          }`}
                          onClick={() => handleEvaluationTypeChange(title)}
                          role="option"
                          aria-selected={state.selectedEvaluationType === title}
                        >
                          {title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Content Textarea */}
              <div className="mb-4">
                <label
                  htmlFor="promptContent"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Prompt Content
                </label>
                <div className="relative">
                  <textarea
                    id="promptContent"
                    className="w-full h-[calc(100vh-20rem)] p-3 rounded-md border bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    value={state.promptInfo}
                    spellCheck="false"
                    onChange={(e) => handlePromptInfoChange(e.target.value)}
                    placeholder="Enter prompt information..."
                    style={{ resize: "none" }}
                  />
                </div>
              </div>

              {/* Apply Changes Button */}
              <div className="flex items-center justify-center mt-4 w-full">
                <Button
                  className="w-full"
                  onClick={handleApplyPrompt}
                  disabled={state.isUpdating || state.loadingPrompt}
                  variant="default"
                >
                  {state.isUpdating ? "Saving..." : "Apply Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ScoreDrawerPrompt;
