import React from 'react';
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Award } from "lucide-react";
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
              return (
                <motion.div
                  key={key}
                  className="space-y-2"
                  variants={item}
                  aria-label={`${formatRatingKey(key)} score: ${value.score} out of ${value.max}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-muted-foreground">
                      {formatRatingKey(key)}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={`${getScoreColor(value.score, value.max)} px-2 py-0.5`}
                    >
                      {value.score}/{value.max}
                    </Badge>
                  </div>
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
