import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ReferenceAnswer } from "./ReferenceAnswer";
import {
  MessageCircle,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  conversationPairs,
  individualEvaluations,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const totalQuestions = conversationPairs?.length || 0;

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
  }, [totalQuestions]);

  if (
    !conversationPairs ||
    !Array.isArray(conversationPairs) ||
    conversationPairs.length === 0
  ) {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  const QuestionsList = () => (
    <div className="p-2 space-y-1">
      {conversationPairs.map((pair, index) => (
        <motion.div
          key={index}
          initial={false}
          animate={{
            scale: selectedIndex === index ? 1.02 : 1,
            backgroundColor:
              selectedIndex === index ? "var(--accent-80)" : "transparent",
          }}
          onClick={() => {
            setSelectedIndex(index);
            setIsSheetOpen(false);
          }}
          className={cn(
            "cursor-pointer px-3 py-2 rounded-lg hover:bg-accent hover:shadow-sm transition-colors",
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
      ))}
    </div>
  );

  return (
    <Card className="overflow-hidden">
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
                <ScrollArea className="h-full">
                  <QuestionsList />
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Questions Sidebar - Desktop */}
          <div className="hidden md:block border-r bg-muted/5">
            <ScrollArea className="h-full">
              <QuestionsList />
            </ScrollArea>
          </div>

          {/* Chat Viewer */}
          <div className="col-span-1 md:col-span-2">
            <ScrollArea className="h-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 space-y-6"
                >
                  {/* Breadcrumb */}
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    Question {selectedIndex + 1} of {totalQuestions}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="space-y-4"
                  >
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

                      {(() => {
                        const evaluation = individualEvaluations[selectedIndex];
                        const hasReferenceAnswer =
                          typeof evaluation === "object" &&
                          evaluation !== null &&
                          "reference_answer" in evaluation &&
                          typeof evaluation.reference_answer === "string" &&
                          evaluation.reference_answer.trim() !== "";

                        if (!hasReferenceAnswer) {
                          return null;
                        }

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.4 }}
                            className="bg-yellow-50 px-4 py-2 rounded-2xl shadow-sm border border-yellow-200"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <BookOpen className="h-4 w-4 text-yellow-600" />
                              <Badge
                                variant="secondary"
                                className="font-medium"
                              >
                                Reference Answer
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-700 italic">
                              <ReferenceAnswer
                                text={evaluation.reference_answer}
                              />
                            </p>
                          </motion.div>
                        );
                      })()}
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
