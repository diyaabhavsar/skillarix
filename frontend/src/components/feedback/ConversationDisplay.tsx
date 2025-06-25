import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ReferenceAnswer } from './ReferenceAnswer';

interface ConversationPair {
  visitor_text: string;
  salesperson_text: string;
}

interface IndividualEvaluation {
  reference_answer?: string;
  [key: string]: any;
}

interface ConversationDisplayProps {
  conversationPairs: ConversationPair[];
  individualEvaluations: IndividualEvaluation[];
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({
  conversationPairs,
  individualEvaluations,
}) => {
  console.log('ConversationDisplay props:', { conversationPairs, individualEvaluations });

  if (!conversationPairs || !Array.isArray(conversationPairs) || conversationPairs.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="flex items-center text-lg">
            <MessageCircle className="h-5 w-5 mr-2 text-indigo-500" />
            CONVERSATION
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-slate-500">
            No conversation data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center text-lg">
          <MessageCircle className="h-5 w-5 mr-2 text-indigo-500" />
          CONVERSATION
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {conversationPairs.map((pair, index) => (
            <div key={index} className="p-4 border-b last:border-b-0">
              <div className="space-y-3">
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-blue-800 mb-1">
                    Visitor
                  </p>
                  <p className="text-sm text-slate-700">
                    {pair.visitor_text}
                  </p>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-green-800 mb-1">
                    Salesperson
                  </p>
                  <p className="text-sm text-slate-700">
                    {pair.salesperson_text}
                  </p>
                </div>
                <div className="bg-green-50/50 rounded-lg p-3">
                  <p className="text-xs font-medium text-yellow-800 mb-1">
                    Reference Answer
                  </p>
                  <p className="text-sm text-slate-700">
                    <ReferenceAnswer
                      text={(() => {
                        const evaluation = individualEvaluations[index];
                        if (
                          typeof evaluation === "object" &&
                          evaluation !== null &&
                          "reference_answer" in evaluation &&
                          typeof evaluation.reference_answer === "string"
                        ) {
                          return evaluation.reference_answer || "No reference answer available";
                        }
                        return "No reference answer available";
                      })()}
                    />
                  </p>
                </div>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
