import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, MessageCircle, BarChart3 } from "lucide-react";

interface IndividualRating {
  score: number;
  max: number;
}

interface IndividualEvaluation {
  evaluation: string;
  reference_answer?: string;
  rating: {
    question_relevance: IndividualRating;
    technical_accuracy: IndividualRating;
    sales_effectiveness: IndividualRating;
    total: IndividualRating;
  };
}

interface ExchangeEvaluationsProps {
  evaluations: IndividualEvaluation[];
  formatEvaluationData: (value: any) => React.ReactNode;
}

const badgeColors: Record<string, string> = {
  question_relevance: 'bg-blue-100 text-blue-800',
  technical_accuracy: 'bg-green-100 text-green-800',
  sales_effectiveness: 'bg-violet-100 text-violet-800',
  total: 'bg-yellow-100 text-yellow-800',
};

const scoreEmoji = (score: number, max: number) => {
  const percent = max > 0 ? (score / max) : 0;
  if (percent >= 0.8) return '✅';
  if (percent >= 0.5) return '⭐';
  if (percent > 0) return '🚫';
  return '';
};

const ExchangeEvaluations: React.FC<ExchangeEvaluationsProps> = ({
  evaluations,
  formatEvaluationData,
}) => {
  if (!evaluations?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <Card className="rounded-2xl shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/30 px-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Exchange Evaluations
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            Individual evaluation of each interaction exchange between the salesperson and customer.
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px] px-2">
            <div className="flex flex-col gap-6 py-6">
              {evaluations.map((ind_eval: IndividualEvaluation, index) => {
                const { rating } = ind_eval;
                const totalScore = rating?.total?.score ?? 0;
                const totalMax = rating?.total?.max ?? 0;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                  >
                    <Card className="rounded-2xl shadow-sm p-5 bg-background border max-w-[90vw] mx-auto">
                      <div className="flex items-center gap-3 mb-3">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-lg tracking-tight">Exchange {index + 1}</h4>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(rating || {}).filter(([key]) => key !== 'total').map(
                          ([key, value]) => (
                            <motion.div
                              key={key}
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
                            >
                              <Badge className={`rounded-full px-3 py-1 font-medium text-xs ${badgeColors[key] || 'bg-muted text-muted-foreground'}`}
                                title={
                                  key === 'question_relevance' ? 'How relevant was the question?' :
                                  key === 'technical_accuracy' ? 'Was the answer technically correct?' :
                                  key === 'sales_effectiveness' ? 'Did the answer help the sale?' :
                                  undefined
                                }
                              >
                                {key.replace(/_/g, ' ')}: {value.score}/{value.max}
                              </Badge>
                            </motion.div>
                          )
                        )}
                      </div>
                      {/* Progress bar and emoji summary */}
                      <div className="flex items-center gap-2 mb-4">
                        <Progress value={totalMax > 0 ? (totalScore / totalMax) * 100 : 0} className="w-40 h-2 bg-slate-100" />
                        <span className="text-xs font-semibold text-slate-600 ml-2">
                          {totalScore}/{totalMax}
                        </span>
                        <span className="ml-2 text-lg">
                          {scoreEmoji(totalScore, totalMax)}
                        </span>
                      </div>
                      {/* Feedback block */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-muted/50 rounded-xl p-4 text-sm leading-relaxed text-wrap"
                      >
                        {formatEvaluationData(ind_eval.evaluation)}
                      </motion.div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExchangeEvaluations;
