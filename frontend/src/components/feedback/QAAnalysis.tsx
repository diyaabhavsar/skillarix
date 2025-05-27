
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type QAItem = {
  id: string;
  question: string;
  userAnswer: string;
  modelAnswer: string;
  score: number;
  feedback: string;
};

interface QAAnalysisProps {
  qaHistory: QAItem[];
}

const QAAnalysis = ({ qaHistory }: QAAnalysisProps) => {
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Questions & Answers</CardTitle>
        <CardDescription>
          Review each question, your response, and model answer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 h-[600px]">
          {/* Left side - Questions list */}
          <div className="w-full md:w-1/3 border rounded-md overflow-y-auto">
            <div className="p-3 bg-muted font-medium">Questions</div>
            <div className="divide-y">
              {qaHistory.map((qa, index) => (
                <button
                  key={qa.id}
                  onClick={() => setSelectedQuestionIndex(index)}
                  className={`w-full text-left p-4 transition-colors ${
                    index === selectedQuestionIndex 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Q{index + 1}: </span>
                      <span className="line-clamp-2 text-muted-foreground">{qa.question}</span>
                    </div>
                    <span className={`ml-2 shrink-0 px-2 py-1 rounded text-xs font-medium ${
                      qa.score >= 8 ? "bg-green-100 text-green-800" : 
                      qa.score >= 6 ? "bg-amber-100 text-amber-800" : 
                      "bg-red-100 text-red-800"
                    }`}>
                      {qa.score}/10
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right side - Selected Q&A details */}
          <div className="w-full md:w-2/3 border rounded-md overflow-y-auto">
            {qaHistory.length > 0 && (
              <div className="p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Question {selectedQuestionIndex + 1}</h3>
                  <p className="text-muted-foreground mb-4">{qaHistory[selectedQuestionIndex].question}</p>
                  <Separator className="my-4" />
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="bg-secondary/20 p-4 rounded-md">
                    <h4 className="font-medium mb-2">Your Answer:</h4>
                    <p className="text-sm">{qaHistory[selectedQuestionIndex].userAnswer}</p>
                  </div>
                  
                  <div className="bg-primary/5 p-4 rounded-md border-l-4 border-primary">
                    <h4 className="font-medium mb-2 flex items-center">
                      <Check className="h-4 w-4 mr-1 text-primary" />
                      Model Answer:
                    </h4>
                    <p className="text-sm">{qaHistory[selectedQuestionIndex].modelAnswer}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Feedback:</h4>
                    <p className="text-sm text-muted-foreground">{qaHistory[selectedQuestionIndex].feedback}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QAAnalysis;
