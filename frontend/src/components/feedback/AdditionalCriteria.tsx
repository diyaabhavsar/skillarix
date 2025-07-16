import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lightbulb, BookOpen, MessageCircle } from "lucide-react";

// Constants
const SCROLL_AREA_HEIGHT = "calc(100vh - 300px)";
const ANIMATION_DELAYS = {
  STAGGER: 0.12,
  FEEDBACK: 0.1,
  EXAMPLE: 0.15,
  SUGGESTION: 0.2,
};

// Types
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

// Utility functions
const getStepTitle = (key: string): string =>
  key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const getStepIcon = (key: string): JSX.Element => {
  const keyLower = key.toLowerCase();
  
  if (keyLower.includes("analogy") || keyLower.includes("example")) {
    return <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  }
  if (keyLower.includes("clarity") || keyLower.includes("communication")) {
    return <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />;
  }
  return <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />;
};

const calculateTotalScores = (criteriaEvaluation: Record<string, AdditionalCriteriaValue>) => {
  let totalScore = 0;
  let totalMax = 0;
  
  Object.values(criteriaEvaluation).forEach((val) => {
    if (val && typeof val === "object" && "score" in val) {
      totalScore += Number(val.score) || 0;
      totalMax += Number(val.max) || 0;
    }
  });
  
  return { totalScore, totalMax };
};

// Components
interface CriteriaItemProps {
  criteriaKey: string;
  value: AdditionalCriteriaValue;
  index: number;
  formatAIGeneratedText: (text: string) => React.ReactNode;
}

const CriteriaItem: React.FC<CriteriaItemProps> = ({
  criteriaKey,
  value,
  index,
  formatAIGeneratedText,
}) => {
  // Extract fields from value
  let score = null;
  let max = null;
  let feedback = "";
  let suggestion = "";
  let example = "";

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
      initial={{ opacity: 0, y: 60, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{
        duration: 0.6,
        delay: index * ANIMATION_DELAYS.STAGGER,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <Card className="border border-border rounded-xl shadow-sm bg-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2 px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            {getStepIcon(criteriaKey)}
            <h3 className="text-lg font-semibold text-card-foreground">
              {getStepTitle(criteriaKey)}
            </h3>
          </div>
          {score !== null && max !== null && (
            <Badge variant="outline" className="text-base px-3 py-1 font-medium">
              {score} / {max}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6 pt-2">
          {feedback && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: ANIMATION_DELAYS.FEEDBACK }}
              className="text-sm text-foreground leading-relaxed"
            >
              {formatAIGeneratedText(feedback)}
            </motion.div>
          )}
          {example && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: ANIMATION_DELAYS.EXAMPLE }}
              className="text-sm text-foreground bg-blue-50 dark:bg-blue-950/30 border-l-4 border-blue-400 dark:border-blue-500 p-3 rounded-md flex items-start gap-2"
            >
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                {formatAIGeneratedText(example)}
              </div>
            </motion.div>
          )}
          {suggestion && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: ANIMATION_DELAYS.SUGGESTION }}
              className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100 text-sm p-3 rounded-md flex items-start gap-2"
            >
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                {formatAIGeneratedText(suggestion)}
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AdditionalCriteria: React.FC<AdditionalCriteriaProps> = ({
  criteriaEvaluation,
  formatAIGeneratedText,
}) => {
  if (!criteriaEvaluation) return null;

  const { totalScore, totalMax } = calculateTotalScores(criteriaEvaluation);

  return (
    <Card className="w-full h-full flex flex-col rounded-2xl shadow-lg bg-card border-border">
      <CardHeader className="pb-6 flex-shrink-0">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
            <Lightbulb className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-card-foreground">
            Additional Criteria
          </CardTitle>
        </div>
        {totalMax > 0 && (
          <div className="flex items-center gap-3 mt-2">
            <Progress 
              value={(totalScore / totalMax) * 100} 
              className="w-64 h-2" 
            />
            <Badge variant="secondary" className="text-sm font-medium">
              {totalScore}/{totalMax}
            </Badge>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 min-h-0 p-0">
        <ScrollArea className="h-full px-6 pb-6">
          <div className="flex flex-col gap-6">
            {Object.entries(criteriaEvaluation).map(
              ([key, value], index) => (
                <CriteriaItem
                  key={key}
                  criteriaKey={key}
                  value={value}
                  index={index}
                  formatAIGeneratedText={formatAIGeneratedText}
                />
              )
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

// Enhanced text formatter for AI-generated content
export function formatAIGeneratedText(text: string): React.ReactNode {
  if (!text) return null;
  
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    
    if (/^[-*]\s+/.test(trimmed)) {
      // List item
      inList = true;
      listItems.push(
        <li key={idx} className="mb-1 text-foreground">
          {trimmed.replace(/^[-*]\s+/, "")}
        </li>
      );
    } else if (trimmed === "") {
      // Paragraph break
      if (inList && listItems.length) {
        elements.push(
          <ul key={`ul-${idx}`} className="list-disc list-inside space-y-1 my-2 text-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    } else {
      // Normal content
      if (inList && listItems.length) {
        elements.push(
          <ul key={`ul-${idx}`} className="list-disc list-inside space-y-1 my-2 text-foreground">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      
      // Bold for headings or labels
      if (/^[A-Z][^:]+:/.test(trimmed)) {
        elements.push(
          <p key={idx} className="font-semibold text-card-foreground mb-2">
            {trimmed}
          </p>
        );
      } else {
        elements.push(
          <p key={idx} className="mb-2 last:mb-0 text-foreground">
            {trimmed}
          </p>
        );
      }
    }
  });
  
  // Handle remaining list items
  if (inList && listItems.length) {
    elements.push(
      <ul key="ul-last" className="list-disc list-inside space-y-1 my-2 text-foreground">
        {listItems}
      </ul>
    );
  }
  
  return <div className="space-y-1">{elements}</div>;
}

export default AdditionalCriteria;
