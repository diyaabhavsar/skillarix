import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ChevronLeft,
  Star,
  ClipboardList,
  MessageCircle,
  BarChart,
  CheckCircle2,
  History,
} from "lucide-react";
import { marked } from "marked";
import { ConversationEvaluation, Rating } from "@/types/conversations";

// Component imports
import OverallPerformance from "@/components/feedback/OverallPerformance";
import CompleteEvaluation from "@/components/feedback/CompleteEvaluation";
import ConversationDisplay from "@/components/feedback/ConversationDisplay";
import ExchangeEvaluations from "@/components/feedback/ExchangeEvaluations";
import AdditionalCriteria from "@/components/feedback/AdditionalCriteria";
import MidEvaluations from "@/components/feedback/MidEvaluations";
import { useTests } from "@/hooks/useTests";

const SessionFeedback: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { fetchTestById } = useTests();
  const [session, setSession] = useState<ConversationEvaluation | null>(null);
  useEffect(() => {
    // Try to get the session data from sessionStorage

    const storedSession = sessionStorage.getItem(`session-${sessionId}`);

    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        setSession(parsedSession);
      } catch (error) {
        console.error("Error parsing session data:", error);
        navigate("/practice");
      }
    } else {
      // If no session data is found, redirect to practice page
      navigate("/practice");
    }
  }, [sessionId, navigate]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper function to format rating keys for display
  const formatRatingKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper functions to safely get values
  const getRatingValue = (rating: any): Rating => {
    if (!rating || typeof rating !== "object") return { score: 0, max: 0 };
    return {
      score: typeof rating.score === "number" ? rating.score : 0,
      max: typeof rating.max === "number" ? rating.max : 0,
    };
  };

  const formatEvaluationValue = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && !Array.isArray(value)) {
      // Render as vertical table
      return (
        <div className="border rounded bg-slate-50 p-3 my-2">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(value).map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-2 py-1 font-medium align-top text-slate-700 whitespace-nowrap">
                    {k.replace(/_/g, " ")}:
                  </td>
                  <td className="py-1 text-slate-600">
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return JSON.stringify(value);
  };

  const formatEvaluationData = (value): React.ReactNode => {
    if (!value) return "";
    let inputVal: any = value;
    if (typeof value === "string") {
      try {
        inputVal = JSON.parse(value);
      } catch {
        return value; // Not a valid JSON string, return as-is
      }
    }

    if (typeof inputVal === "string") return inputVal;

    if (typeof inputVal === "object" && !Array.isArray(inputVal)) {
      return (
        <div className="border rounded bg-slate-50 p-3 my-2">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(inputVal).map(([k, v]) => {
                let displayValue: React.ReactNode;

                if (
                  typeof v === "string" ||
                  typeof v === "number" ||
                  typeof v === "boolean"
                ) {
                  displayValue = v.toString();
                } else if (typeof v === "object") {
                  try {
                    displayValue = (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(v, null, 2)}
                      </pre>
                    );
                  } catch {
                    displayValue = "Unserializable object";
                  }
                } else {
                  displayValue = String(v);
                }

                return (
                  <tr key={k}>
                    <td className="pr-2 py-1 font-medium align-top text-slate-700 whitespace-nowrap">
                      {k.replace(/_/g, " ")}:
                    </td>
                    <td className="py-1 text-slate-600">{displayValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return JSON.stringify(inputVal, null, 2);
  };

  const formatAIGeneratedText = (text) => {
    if (!text) return "";
    const cleanHTML = marked.parse(text); // Converts Markdown to HTML
    return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
  };

  // Render rating as a progress bar with score and max
  const renderRating = (rating: any) => {
    const { score, max } = getRatingValue(rating);
    const percentage = max > 0 ? (score / max) * 100 : 0;

    return (
      <div className="space-y-0.5 max-w-[200px] ml-auto">
        <div className="flex justify-end items-center text-xs">
          <span className="font-medium text-slate-600">
            {score}/{max}
          </span>
        </div>
        <div className="relative h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-400/70 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const { evaluation_data, conversation_data, created_at, test_id } = session;

  // Ensure the data structure is valid
  const validConversationPairs = conversation_data?.pairs || [];
  const validIndividualEvaluations =
    evaluation_data?.individual_evaluations || [];
  const test = fetchTestById(test_id);

  return (
    <div className="space-y-6 container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/practice")}
          className="hover:bg-slate-100 hover:text-primary text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          <p className="text-sm text-slate-500">{formatDate(created_at)}</p>
          <Button
            variant="default"
            onClick={() =>
              navigate(`/test-configurations/${session?.testConfigurationId}`)
            }
            className="bg-primary text-white hover:bg-primary-dark text-sm px-6 py-3 rounded-md shadow-md"
          >
            Test Configuration
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overall-performance" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg space-x-1">
          <TabsTrigger
            value="overall-performance"
            className="flex items-center gap-2 text-violet-600 hover:text-violet-700 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-900 data-[state=active]:font-medium transition-all"
          >
            <Star className="h-4 w-4" />
            Overall Performance
          </TabsTrigger>
          <TabsTrigger
            value="complete-evaluation"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 data-[state=active]:font-medium transition-all"
          >
            <ClipboardList className="h-4 w-4" />
            Complete Evaluation
          </TabsTrigger>
          <TabsTrigger
            value="conversation"
            className="flex items-center gap-2 text-green-600 hover:text-green-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-900 data-[state=active]:font-medium transition-all"
          >
            <MessageCircle className="h-4 w-4" />
            Conversation
          </TabsTrigger>
          <TabsTrigger
            value="exchange-evaluations"
            className="flex items-center gap-2 text-orange-600 hover:text-orange-700 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-900 data-[state=active]:font-medium transition-all"
          >
            <BarChart className="h-4 w-4" />
            Exchange Evaluations
          </TabsTrigger>
          <TabsTrigger
            value="additional-criteria"
            className="flex items-center gap-2 text-pink-600 hover:text-pink-700 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-900 data-[state=active]:font-medium transition-all"
          >
            <CheckCircle2 className="h-4 w-4" />
            Additional Criteria
          </TabsTrigger>
          <TabsTrigger
            value="mid-evaluations"
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:font-medium transition-all"
          >
            <History className="h-4 w-4" />
            Mid Evaluations
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overall-performance" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <OverallPerformance
                  completeRating={evaluation_data.complete_rating}
                  formatRatingKey={formatRatingKey}
                  renderRating={renderRating}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="complete-evaluation" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <CompleteEvaluation
                  completeEvaluation={evaluation_data.complete_evaluation}
                  formatEvaluationValue={formatEvaluationValue}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="conversation" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <ScrollArea className="h-[600px] pr-4">
                  <ConversationDisplay
                    conversationPairs={validConversationPairs}
                    individualEvaluations={validIndividualEvaluations}
                  />
                </ScrollArea>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="exchange-evaluations" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <ExchangeEvaluations
                  evaluations={evaluation_data.individual_evaluations}
                  formatEvaluationData={formatEvaluationData}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="additional-criteria" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <AdditionalCriteria
                  criteriaEvaluation={
                    evaluation_data.additional_criteria_evaluation
                  }
                  formatAIGeneratedText={formatAIGeneratedText}
                />
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="mid-evaluations" className="mt-6" asChild>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-1">
                <MidEvaluations
                  evaluations={evaluation_data.mid_evaluations}
                  formatAIGeneratedText={formatAIGeneratedText}
                />
              </div>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default SessionFeedback;
