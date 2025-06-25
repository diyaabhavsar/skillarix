import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";

interface MidEvaluationsProps {
  evaluations: string[];
  formatAIGeneratedText: (text: string) => React.ReactNode;
}

const MidEvaluations: React.FC<MidEvaluationsProps> = ({
  evaluations,
  formatAIGeneratedText,
}) => {
  if (!evaluations?.length) return null;

  return (
    <Card className="w-full container px-4 py-6 rounded-2xl shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <Clock className="h-7 w-7 text-orange-500 bg-orange-100 rounded-full p-1" />
          Mid Evaluations
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2 ml-1">
          These are AI-generated mid-session evaluations and suggestions for improvement.
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {evaluations.map((midEval, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="bg-muted/50 border border-muted rounded-xl p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold text-base text-foreground">Mid Evaluation {idx + 1}</h3>
                <Badge variant="secondary" className="ml-2">AI Feedback</Badge>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed mid-eval-content">
                {formatAIGeneratedText(midEval)}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
      {/* Inline style for formatting bullets, margins, and text */}
      <style>{`
        .mid-eval-content {
          margin-left: 0.5rem;
        }
        .mid-eval-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .mid-eval-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .mid-eval-content li {
          margin-bottom: 0.25rem;
        }
        .mid-eval-content p {
          margin-bottom: 0.5rem;
        }
      `}</style>
    </Card>
  );
};

export default MidEvaluations;
