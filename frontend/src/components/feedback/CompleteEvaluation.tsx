import React from "react";
import { motion, Variants } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  Star,
  AlertTriangle,
  Activity,
  LightbulbIcon,
} from "lucide-react";

const getIconBackground = (key: string): string => {
  switch (key) {
    case "overall_score":
      return "bg-yellow-50 ring-1 ring-yellow-100";
    case "key_successful_moments":
    case "strengths":
      return "bg-green-50 ring-1 ring-green-100";
    case "critical_missed_opportunities":
    case "weaknesses":
      return "bg-orange-50 ring-1 ring-orange-100";
    case "pattern_analysis":
    case "summary":
      return "bg-blue-50 ring-1 ring-blue-100";
    case "recommendations":
      return "bg-violet-50 ring-1 ring-violet-100";
    default:
      return "bg-slate-50 ring-1 ring-slate-100";
  }
};

const titleMappings: Record<string, { title: string; icon: React.ReactNode }> =
{
  overall_score: {
    title: "Overall Evaluation",
    icon: <Star className="h-5 w-5 text-yellow-500" />,
  },
  summary: {
    title: "Executive Summary",
    icon: <Activity className="h-5 w-5 text-blue-500" />,
  },
  strengths: {
    title: "Key Strengths",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
  },
  weaknesses: {
    title: "Areas for Improvement",
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  },
  key_successful_moments: {
    title: "Key Successful Moments",
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
  },
  critical_missed_opportunities: {
    title: "Critical Missed Opportunities",
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  },
  pattern_analysis: {
    title: "Pattern Analysis",
    icon: <Activity className="h-5 w-5 text-blue-500" />,
  },
  recommendations: {
    title: "Recommendations",
    icon: <LightbulbIcon className="h-5 w-5 text-violet-500" />,
  },
};

// Removed EvaluationBlock component as it's been integrated into the main component

interface CompleteEvaluationProps {
  completeEvaluation: Record<string, any>;
  formatEvaluationValue: (value: any) => React.ReactNode;
}

const CompleteEvaluation: React.FC<CompleteEvaluationProps> = ({
  completeEvaluation,
  formatEvaluationValue,
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
      },
    },
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full scroll-mt-20"
    >
      <Card className="rounded-xl shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 rounded-full bg-gradient-to-br from-green-100 to-green-50">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            Complete Evaluation Report
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-6 bg-slate-50/30">
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 auto-rows-min">
            {Object.entries(completeEvaluation || {}).map(
              ([key, value], index) => {
                const mapping = titleMappings[key] || {
                  title: key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
                  icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
                };

                // Full width for Summary and large text blocks
                const isFullWidth = key === "summary" || key === "pattern_analysis";

                // Accent borders
                let accentClass = "border-l-4 border-l-slate-200";
                if (key === 'strengths' || key === 'key_successful_moments') accentClass = "border-l-4 border-l-green-500";
                if (key === 'weaknesses' || key === 'critical_missed_opportunities') accentClass = "border-l-4 border-l-orange-500";
                if (key === 'summary' || key === 'pattern_analysis') accentClass = "border-l-4 border-l-blue-500";
                if (key === 'recommendations') accentClass = "border-l-4 border-l-violet-500";
                if (key === 'overall_score') accentClass = "border-l-4 border-l-yellow-500";

                return (
                  <motion.div
                    key={key}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    id={key.replace(/_/g, "-")}
                    className={`flex flex-col w-full ${isFullWidth ? 'lg:col-span-2' : ''}`}
                  >
                    <Card className={`h-full hover:shadow-lg hover:scale-[1.01] transition-all duration-300 ease-in-out overflow-hidden bg-white ${accentClass}`}>
                      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50/80 to-transparent border-b border-slate-100/50">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl shadow-sm ${getIconBackground(
                              key
                            )}`}
                          >
                            {mapping.icon}
                          </div>
                          <h3 className="font-bold text-lg tracking-tight text-slate-800">
                            {mapping.title}
                          </h3>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-5 pb-5">
                        <div className="text-slate-600 text-sm leading-relaxed">
                          {formatEvaluationValue(value)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CompleteEvaluation;
