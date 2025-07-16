import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReferenceAnswer } from "./ReferenceAnswer";
import { MessageSquare, BookOpen, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Constants
const QUESTIONS_PER_VIEW = 6;
const QUESTION_HEIGHT = 80;
const SCROLL_TIMEOUT = 100;
const USER_SCROLL_RESET_DELAY = 500;

// Types
interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface IndividualEvaluation {
  reference_answer?: string;
  [key: string]: any;
}

interface ConversationDisplayProps {
  conversationPairs: ConversationPair[];
  individualEvaluations: IndividualEvaluation[];
}

// Custom hooks
const useScrollToQuestion = (
  scrollAreaRef: React.RefObject<any>,
  selectedIndex: number,
  isUserScrolling: boolean
) => {
  const isElementVisible = useCallback(
    (element: Element, viewport: Element): boolean => {
      const viewportRect = viewport.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      return (
        elementRect.top >= viewportRect.top &&
        elementRect.bottom <= viewportRect.bottom
      );
    },
    []
  );

  const scrollToQuestion = useCallback(() => {
    // Only auto-scroll if user hasn't manually scrolled
    if (!scrollAreaRef.current || isUserScrolling) return;

    const viewport = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!viewport) return;

    const selectedElement = viewport.querySelector(
      `[data-question-index="${selectedIndex}"]`
    );
    if (!selectedElement) return;

    if (!isElementVisible(selectedElement, viewport)) {
      selectedElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [scrollAreaRef, selectedIndex, isUserScrolling, isElementVisible]);

  useEffect(() => {
    const timeoutId = setTimeout(scrollToQuestion, SCROLL_TIMEOUT);
    return () => clearTimeout(timeoutId);
  }, [scrollToQuestion]);
};

// Remove the auto-reset hook - user scroll position should persist
// const useUserScrollReset = (
//   isUserScrolling: boolean,
//   setIsUserScrolling: React.Dispatch<React.SetStateAction<boolean>>
// ) => {
//   useEffect(() => {
//     if (!isUserScrolling) return;

//     const resetScrollingFlag = setTimeout(() => {
//       setIsUserScrolling(false);
//     }, USER_SCROLL_RESET_DELAY);

//     return () => clearTimeout(resetScrollingFlag);
//   }, [isUserScrolling, setIsUserScrolling]);
// };

const useKeyboardNavigation = (
  totalQuestions: number,
  setSelectedIndex: React.Dispatch<React.SetStateAction<number>>
) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalQuestions, setSelectedIndex]);
};

// Components
interface QuestionItemProps {
  pair: ConversationPair;
  index: number;
  selectedIndex: number;
  onQuestionClick: (index: number) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  pair,
  index,
  selectedIndex,
  onQuestionClick,
}) => (
  <motion.div
    data-question-index={index}
    initial={false}
    animate={{
      scale: selectedIndex === index ? 1.02 : 1,
      backgroundColor:
        selectedIndex === index ? "var(--accent-80)" : "transparent",
    }}
    onClick={() => onQuestionClick(index)}
    className={cn(
      "cursor-pointer px-3 py-2 rounded-lg hover:bg-accent hover:shadow-sm transition-colors min-h-[72px]",
      selectedIndex === index && "border-l-4 border-primary shadow-sm"
    )}
  >
    <div className="flex items-start gap-3">
      <Badge
        variant="secondary"
        className="shrink-0 h-5 w-5 flex items-center justify-center rounded-full"
      >
        {index + 1}
      </Badge>
      <p className="text-sm leading-tight">{pair.visitor_text}</p>
    </div>
  </motion.div>
);

interface QuestionsListProps {
  conversationPairs: ConversationPair[];
  selectedIndex: number;
  onQuestionClick: (index: number) => void;
  scrollAreaRef: React.RefObject<any>;
}

const QuestionsList: React.FC<QuestionsListProps> = ({
  conversationPairs,
  selectedIndex,
  onQuestionClick,
  scrollAreaRef,
}) => (
  <ScrollArea
    ref={scrollAreaRef}
    className="h-full"
    style={{ maxHeight: `calc(${QUESTIONS_PER_VIEW} * ${QUESTION_HEIGHT}px)` }}
  >
    <div className="space-y-1 p-2">
      {conversationPairs.map((pair, index) => (
        <QuestionItem
          key={index}
          pair={pair}
          index={index}
          selectedIndex={selectedIndex}
          onQuestionClick={onQuestionClick}
        />
      ))}
    </div>
  </ScrollArea>
);

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  conversationPairs,
  individualEvaluations,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollAreaRef = useRef<any>(null);
  const totalQuestions = conversationPairs?.length || 0;

  // Custom hooks
  useScrollToQuestion(scrollAreaRef, selectedIndex, isUserScrolling);
  // Removed useUserScrollReset - scroll position now persists
  useKeyboardNavigation(totalQuestions, setSelectedIndex);

  const handleQuestionClick = useCallback((index: number) => {
    setIsUserScrolling(true);
    setSelectedIndex(index);
    setIsSheetOpen(false);
  }, []);

  const questionsListProps = {
    conversationPairs,
    selectedIndex,
    onQuestionClick: handleQuestionClick,
    scrollAreaRef,
  };

  if (!conversationPairs?.length) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-2xl font-bold">
            <MessageSquare className="h-6 w-6 mr-3 text-primary" />
            Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-slate-500">
            No conversation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-2xl font-bold">
            <MessageSquare className="h-6 w-6 mr-3 text-primary" />
            Conversations
          </CardTitle>

          {/* Mobile Question Selector */}
          <div className="md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-2" />
                  Question {selectedIndex + 1}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0">
                <QuestionsList {...questionsListProps} />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(600px-4rem)]">
          {/* Questions Sidebar - Desktop */}
          <div className="hidden md:block border-r bg-muted/5">
            <QuestionsList {...questionsListProps} />
          </div>

          {/* Chat Viewer */}
          <div className="col-span-1 md:col-span-2">
            <ScrollArea className="h-full">
              <div className="p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Breadcrumb */}
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      Question {selectedIndex + 1} of {totalQuestions}
                    </div>

                    <div className="flex flex-col gap-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-blue-50 px-4 py-2 rounded-2xl w-fit max-w-[80%] self-start shadow-sm"
                      >
                        <p className="text-xs font-medium text-blue-800 mb-1">
                          Visitor
                        </p>
                        <p className="text-sm text-slate-700">
                          {conversationPairs[selectedIndex].visitor_text}
                        </p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="bg-green-50 px-4 py-2 rounded-2xl w-fit max-w-[80%] self-end shadow-sm"
                      >
                        <p className="text-xs font-medium text-green-800 mb-1">
                          Salesperson
                        </p>
                        <p className="text-sm text-slate-700">
                          {conversationPairs[selectedIndex].salesperson_text}
                        </p>
                      </motion.div>

                      {individualEvaluations[selectedIndex]
                        ?.reference_answer && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="bg-yellow-50 px-4 py-2 rounded-2xl shadow-sm border border-yellow-200"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="h-4 w-4 text-yellow-600" />
                            <Badge variant="secondary" className="font-medium">
                              Reference Answer
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 italic">
                            <ReferenceAnswer
                              text={
                                individualEvaluations[selectedIndex]
                                  .reference_answer
                              }
                            />
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
