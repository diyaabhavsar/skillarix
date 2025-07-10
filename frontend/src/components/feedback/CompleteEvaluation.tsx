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
      return "bg-yellow-50";
    case "key_successful_moments":
      return "bg-green-50";
    case "critical_missed_opportunities":
      return "bg-orange-50";
    case "pattern_analysis":
      return "bg-blue-50";
    case "recommendations":
      return "bg-violet-50";
    default:
      return "bg-slate-50";
  }
};

const titleMappings: Record<string, { title: string; icon: React.ReactNode }> =
  {
    overall_score: {
      title: "Overall Evaluation",
      icon: <Star className="h-5 w-5 text-yellow-500" />,
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

        <CardContent className="p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            {Object.entries(completeEvaluation || {}).map(
              ([key, value], index) => {
                const mapping = titleMappings[key] || {
                  title: key
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" "),
                  icon: <CheckCircle className="h-5 w-5 text-slate-500" />,
                };

                return (
                  <motion.div
                    key={key}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    id={key.replace(/_/g, "-")}
                    className="flex flex-col w-full"
                  >
                    <Card className="h-full hover:shadow-lg transition-all duration-300 ease-in-out">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${getIconBackground(
                              key
                            )}`}
                          >
                            {mapping.icon}
                          </div>
                          <h3 className="font-semibold text-lg tracking-tight">
                            {mapping.title}
                          </h3>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-muted-foreground text-sm leading-relaxed max-w-[600px]">
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
