import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Award, Info, ChevronDown, ChevronUp } from "lucide-react";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

import { CompleteRating, Rating } from '@/types/conversations';

interface OverallPerformanceProps {
  completeRating: CompleteRating;
  formatRatingKey: (key: string) => string;
  renderRating?: (rating: Rating) => React.ReactNode;
}

const OverallPerformance: React.FC<OverallPerformanceProps> = ({
  completeRating,
  formatRatingKey,
}) => {
  const [expandedReasoning, setExpandedReasoning] = useState<string | null>(null);

  if (!completeRating) return null;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 70) return 'bg-green-100 text-green-700 border-green-200';
    if (percentage >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const toggleReasoning = (key: string) => {
    setExpandedReasoning(expandedReasoning === key ? null : key);
  };

  return (
    <Card className="rounded-xl shadow-md bg-card">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <Star className="h-5 w-5 mr-2 text-yellow-500" />
          Overall Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <motion.div
          className="space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {Object.entries(completeRating)
            .filter(([key]) => key !== "total")
            .map(([key, value]) => {
              const percentage = (value.score / value.max) * 100;
              const hasReasoning = value.reasoning && value.reasoning.trim().length > 0;
              const isExpanded = expandedReasoning === key;

              return (
                <motion.div
                  key={key}
                  className="space-y-2"
                  variants={item}
                  aria-label={`${formatRatingKey(key)} score: ${value.score} out of ${value.max}`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {formatRatingKey(key)}
                      </span>
                      {hasReasoning && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-primary/10"
                          onClick={() => toggleReasoning(key)}
                          title="View reasoning"
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-primary" />
                          ) : (
                            <Info className="h-4 w-4 text-primary" />
                          )}
                        </Button>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={`${getScoreColor(value.score, value.max)} px-2 py-0.5`}
                    >
                      {value.score}/{value.max}
                    </Badge>
                  </div>

                  {/* Reasoning Section */}
                  <AnimatePresence>
                    {hasReasoning && isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-blue-900 mb-1">
                                Why this score?
                              </p>
                              <p className="text-sm text-blue-800 leading-relaxed">
                                {value.reasoning}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </motion.div>
              );
            })}

          {completeRating.total && (
            <motion.div
              className="mt-8 pt-6 border-t"
              variants={item}
            >
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Total Score</h3>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getScoreColor(completeRating.total.score, completeRating.total.max)} px-3 py-1`}
                  >
                    {completeRating.total.score}/{completeRating.total.max}
                  </Badge>
                </div>
                <div className="w-24 h-24">
                  <CircularProgressbar
                    value={(completeRating.total.score / completeRating.total.max) * 100}
                    text={`${Math.round((completeRating.total.score / completeRating.total.max) * 100)}%`}
                    styles={buildStyles({
                      pathColor: 'hsl(var(--primary))',
                      textColor: 'hsl(var(--primary))',
                      trailColor: 'hsl(var(--muted))',
                      pathTransition: 'stroke-dashoffset 0.7s ease-out'
                    })}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default OverallPerformance;
