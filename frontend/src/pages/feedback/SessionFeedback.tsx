import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { marked } from "marked";
import DOMPurify from "dompurify";
import {
  ChevronLeft,
  Star,
  ClipboardList,
  MessageCircle,
  BarChart,
  CheckCircle2,
  History,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";

// App Components
import TestConfigurationDetails from "@/components/testconfig/TestConfigurationDetails";
import OverallPerformance from "@/components/feedback/OverallPerformance";
import CompleteEvaluation from "@/components/feedback/CompleteEvaluation";
import ConversationDisplay from "@/components/feedback/ConversationDisplay";
import ExchangeEvaluations from "@/components/feedback/ExchangeEvaluations";
import AdditionalCriteria from "@/components/feedback/AdditionalCriteria";
import MidEvaluations from "@/components/feedback/MidEvaluations";

// Hooks & Types
import { useTests } from "@/hooks/useTests";
import { useProducts } from "@/hooks/useProducts";
import { ConversationEvaluation, Rating } from "@/types/conversations";

// Utils
import { formatDateToIndianTime } from "@/utils/dateUtils";

const SessionFeedback: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { getTestById } = useTests();
  const { products } = useProducts();

  const [session, setSession] = useState<ConversationEvaluation | null>(null);
  const [test, setTest] = useState<any>(null);

  const formatValue = (value: string): string =>
    value
      ? value
          .split(/[-_]/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "-";

  const formatDate = (dateString: string) =>
    formatDateToIndianTime(dateString, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const formatRatingKey = (key: string) =>
    key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getProductName = (productId: string) =>
    products.find((p) => p._id === productId)?.name || "Unknown Product";

  const getRatingValue = (rating: any): Rating => ({
    score: rating?.score ?? 0,
    max: rating?.max ?? 0,
  });

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

  const formatEvaluationValue = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
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
        return value;
      }
    }
    if (typeof inputVal === "object") {
      return (
        <div className="border rounded bg-slate-50 p-3 my-2">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(inputVal).map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-2 py-1 font-medium align-top text-slate-700 whitespace-nowrap">
                    {k.replace(/_/g, " ")}:
                  </td>
                  <td className="py-1 text-slate-600">
                    {typeof v === "object" ? (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(v, null, 2)}
                      </pre>
                    ) : (
                      v.toString()
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return JSON.stringify(inputVal);
  };

  const formatAIGeneratedText = (text: string) => {
    if (!text) return "";

    // Parse markdown to HTML synchronously
    const htmlContent = marked(text) as string;

    // Sanitize the HTML to prevent XSS attacks
    const sanitizedHtml = DOMPurify.sanitize(htmlContent);

    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  };

  useEffect(() => {
    const storedSession = sessionStorage.getItem(`session-${sessionId}`);
    if (storedSession) {
      try {
        setSession(JSON.parse(storedSession));
      } catch {
        navigate("/practice");
      }
    } else {
      navigate("/practice");
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    if (session?.test_config_id) {
      getTestById(session.test_config_id).then(setTest).catch(console.error);
    }
  }, [session?.test_config_id]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const { evaluation_data, conversation_data, created_at } = session;
  const validConversationPairs = conversation_data?.pairs || [];
  const validIndividualEvaluations =
    evaluation_data?.individual_evaluations || [];

  // Define available tabs based on data
  const availableTabs = [
    {
      value: "overall-performance",
      label: "Overall Performance",
      icon: Star,
      color: "violet",
      hasData: !!evaluation_data?.complete_rating,
    },
    {
      value: "complete-evaluation",
      label: "Complete Evaluation",
      icon: ClipboardList,
      color: "blue",
      hasData: !!evaluation_data?.complete_evaluation,
    },
    {
      value: "conversation",
      label: "Conversation",
      icon: MessageCircle,
      color: "green",
      hasData: validConversationPairs.length > 0,
    },
    {
      value: "exchange-evaluations",
      label: "Exchange Evaluations",
      icon: BarChart,
      color: "orange",
      hasData: validIndividualEvaluations.length > 0,
    },
    {
      value: "additional-criteria",
      label: "Additional Criteria",
      icon: CheckCircle2,
      color: "pink",
      hasData: !!evaluation_data?.additional_criteria_evaluation,
    },
    {
      value: "mid-evaluations",
      label: "Mid Evaluations",
      icon: History,
      color: "teal",
      hasData: evaluation_data?.mid_evaluations?.length > 0,
    },
  ].filter((tab) => tab.hasData);

  // Color class mapping to avoid dynamic class generation
  const getTabClasses = (color: string) => {
    const colorClasses = {
      violet:
        "flex items-center gap-2 text-violet-600 hover:text-violet-700 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-900 data-[state=active]:font-medium transition-all",
      blue: "flex items-center gap-2 text-blue-600 hover:text-blue-700 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 data-[state=active]:font-medium transition-all",
      green:
        "flex items-center gap-2 text-green-600 hover:text-green-700 data-[state=active]:bg-green-50 data-[state=active]:text-green-900 data-[state=active]:font-medium transition-all",
      orange:
        "flex items-center gap-2 text-orange-600 hover:text-orange-700 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-900 data-[state=active]:font-medium transition-all",
      pink: "flex items-center gap-2 text-pink-600 hover:text-pink-700 data-[state=active]:bg-pink-50 data-[state=active]:text-pink-900 data-[state=active]:font-medium transition-all",
      teal: "flex items-center gap-2 text-teal-600 hover:text-teal-700 data-[state=active]:bg-teal-50 data-[state=active]:text-teal-900 data-[state=active]:font-medium transition-all",
    };
    return (
      colorClasses[color as keyof typeof colorClasses] || colorClasses.violet
    );
  };

  // Get the first available tab as default
  const defaultTab = availableTabs[0]?.value || "overall-performance";

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
          <p className="text-sm text-slate-500">
            {formatDateToIndianTime(created_at, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZoneName: "short",
            })}
          </p>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="bg-primary text-white text-sm px-6 py-3 rounded-md shadow-md">
                Test Configuration
              </Button>
            </SheetTrigger>
            {test && test._id ? (
              <TestConfigurationDetails
                test={test}
                formatDate={formatDate}
                formatValue={formatValue}
                getProductName={getProductName}
              />
            ) : (
              <div className="p-6 text-center text-muted-foreground">
                Test configuration not found.
              </div>
            )}
          </Sheet>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 rounded-lg space-x-1">
          {availableTabs.map(({ value, label, icon: Icon, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={getTabClasses(color)}
            >
              <Icon className="h-4 w-4" /> {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {availableTabs.find((tab) => tab.value === "overall-performance") && (
            <TabsContent value="overall-performance" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <OverallPerformance
                  completeRating={evaluation_data.complete_rating}
                  formatRatingKey={formatRatingKey}
                  renderRating={renderRating}
                />
              </motion.div>
            </TabsContent>
          )}

          {availableTabs.find((tab) => tab.value === "complete-evaluation") && (
            <TabsContent value="complete-evaluation" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CompleteEvaluation
                  completeEvaluation={evaluation_data.complete_evaluation}
                  formatEvaluationValue={formatEvaluationValue}
                />
              </motion.div>
            </TabsContent>
          )}

          {availableTabs.find((tab) => tab.value === "conversation") && (
            <TabsContent value="conversation" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ConversationDisplay
                  conversationPairs={validConversationPairs}
                  individualEvaluations={validIndividualEvaluations}
                />
              </motion.div>
            </TabsContent>
          )}

          {availableTabs.find(
            (tab) => tab.value === "exchange-evaluations"
          ) && (
            <TabsContent value="exchange-evaluations" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ExchangeEvaluations
                  evaluations={evaluation_data.individual_evaluations}
                  formatEvaluationData={formatEvaluationData}
                />
              </motion.div>
            </TabsContent>
          )}

          {availableTabs.find((tab) => tab.value === "additional-criteria") && (
            <TabsContent value="additional-criteria" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <AdditionalCriteria
                  criteriaEvaluation={
                    evaluation_data.additional_criteria_evaluation
                  }
                  formatAIGeneratedText={formatAIGeneratedText}
                />
              </motion.div>
            </TabsContent>
          )}

          {availableTabs.find((tab) => tab.value === "mid-evaluations") && (
            <TabsContent value="mid-evaluations" className="mt-6" asChild>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <MidEvaluations
                  evaluations={evaluation_data.mid_evaluations}
                  formatAIGeneratedText={formatAIGeneratedText}
                />
              </motion.div>
            </TabsContent>
          )}
        </AnimatePresence>
      </Tabs>
    </div>
  );
};

export default SessionFeedback;
