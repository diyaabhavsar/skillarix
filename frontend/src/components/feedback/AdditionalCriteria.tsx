import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, BookOpen, MessageCircle } from "lucide-react";

interface CriteriaValue {
  score?: number;
  max?: number;
  feedback?: string;
  suggestion?: string;
  example?: string;
  [key: string]: any;
}

type AdditionalCriteriaValue = CriteriaValue | string | null;

interface AdditionalCriteriaProps {
  criteriaEvaluation: Record<string, AdditionalCriteriaValue>;
  formatAIGeneratedText: (text: string) => React.ReactNode;
}

const getStepTitle = (key: string) =>
  key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStepIcon = (key: string) => {
  if (
    key.toLowerCase().includes("analogy") ||
    key.toLowerCase().includes("example")
  )
    return <BookOpen className="h-5 w-5 text-blue-500" />;
  if (key.toLowerCase().includes("clarity"))
    return <MessageCircle className="h-5 w-5 text-purple-500" />;
  return <Lightbulb className="h-5 w-5 text-yellow-500" />;
};

const AdditionalCriteria: React.FC<AdditionalCriteriaProps> = ({
  criteriaEvaluation,
  formatAIGeneratedText,
}) => {
  if (!criteriaEvaluation) return null;

  // Calculate total score/max if available
  let totalScore = 0,
    totalMax = 0;
  Object.values(criteriaEvaluation).forEach((val) => {
    if (val && typeof val === "object" && "score" in val) {
      totalScore += Number(val.score) || 0;
      totalMax += Number(val.max) || 0;
    }
  });

  return (
    <Card className="w-full container px-4 py-8 rounded-2xl shadow-lg bg-background">
      <CardHeader className="pb-6">
        <div className="flex items-center gap-4 mb-2">
          <Lightbulb className="h-8 w-8 text-yellow-500 bg-yellow-100 rounded-full p-1" />
          <CardTitle className="text-2xl font-bold">
            Additional Criteria
          </CardTitle>
        </div>
        {totalMax > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <Progress value={totalScore} max={totalMax} className="w-64" />
            <span className="text-sm text-muted-foreground">
              {totalScore}/{totalMax}
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px]">
          <div className="flex flex-col gap-10 additional-criteria-content">
            {Object.entries(criteriaEvaluation).map(
              ([key, value]: [string, AdditionalCriteriaValue], idx) => {
                // Extract fields
                let score = null,
                  max = null,
                  feedback = "",
                  suggestion = "",
                  example = "";
                if (value && typeof value === "object") {
                  score = "score" in value ? value.score : null;
                  max = "max" in value ? value.max : null;
                  feedback = value.feedback || value.summary || "";
                  suggestion = value.suggestion || value.tip || "";
                  example = value.example || "";
                } else if (typeof value === "string") {
                  feedback = value;
                }
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 60, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.6,
                      delay: idx * 0.12,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <Card className="border border-muted rounded-xl shadow-md p-0 bg-white">
                      <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pt-6 pb-2">
                        <div className="flex items-center gap-3">
                          {getStepIcon(key)}
                          <h3 className="text-lg font-semibold text-foreground">
                            {getStepTitle(key)}
                          </h3>
                        </div>
                        {score !== null && max !== null && (
                          <Badge
                            variant="outline"
                            className="text-base px-3 py-1"
                          >
                            {score} / {max}
                          </Badge>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4 px-6 pb-6 pt-2 additional-criteria-content">
                        {feedback && (
                          <motion.p
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-sm text-muted-foreground mb-1"
                          >
                            {formatAIGeneratedText(feedback)}
                          </motion.p>
                        )}
                        {example && (
                          <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="text-sm italic text-muted-foreground bg-muted/10 border-l-4 border-blue-200 p-3 rounded-md mb-1 flex items-center gap-2"
                          >
                            <BookOpen className="h-4 w-4 text-blue-400" />
                            <span>{formatAIGeneratedText(example)}</span>
                          </motion.div>
                        )}
                        {suggestion && (
                          <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-yellow-50 border border-yellow-300 text-yellow-900 text-sm p-3 rounded-md flex items-start gap-2"
                          >
                            <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-500" />
                            <span>{formatAIGeneratedText(suggestion)}</span>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <style>{`
        .additional-criteria-content {
          margin-left: 0.5rem;
        }
        .additional-criteria-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .additional-criteria-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .additional-criteria-content li {
          margin-bottom: 0.25rem;
        }
        .additional-criteria-content p {
          margin-bottom: 0.5rem;
        }
        .py-8 {
          padding-top: 1rem;
          padding-bottom: 2rem;
        }
      `}</style>
    </Card>
  );
};

// Example formatter for AI/dynamic text
export function formatAIGeneratedText(text: string): React.ReactNode {
  // Simple parser: converts lines starting with "-" or "*" to <ul><li>
  // and double line breaks to <p>
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/^[-*]\s+/.test(trimmed)) {
      // List item
      inList = true;
      listItems.push(<li key={idx}>{trimmed.replace(/^[-*]\s+/, "")}</li>);
    } else if (trimmed === "") {
      // Paragraph break
      if (inList && listItems.length) {
        elements.push(<ul key={`ul-${idx}`}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }
    } else {
      // Normal paragraph or heading
      if (inList && listItems.length) {
        elements.push(<ul key={`ul-${idx}`}>{listItems}</ul>);
        listItems = [];
        inList = false;
      }
      // Bold for headings or strong lines
      if (/^[A-Z][^:]+:/.test(trimmed)) {
        elements.push(<strong key={idx}>{trimmed}</strong>);
      } else {
        elements.push(<p key={idx}>{trimmed}</p>);
      }
    }
  });
  if (inList && listItems.length) {
    elements.push(<ul key="ul-last">{listItems}</ul>);
  }
  return elements;
}

export default AdditionalCriteria;
