import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MessageCircle, Star, CheckCircle, Clock, AlertCircle } from "lucide-react";

interface ConversationEvaluation {
  _id: string;
  product_id: string;
  user_id: string;
  conversation_data: {
    pairs: {
      visitor_text: string;
      salesperson_text: string;
    }[];
  };
  evaluation_data: {
    individual_evaluations: {
      evaluation: string;
      rating: {
        question_relevance: { score: number; max: number };
        technical_accuracy: { score: number; max: number };
        sales_effectiveness: { score: number; max: number };
        total: { score: number; max: number };
      };
    }[];
    mid_evaluations: string[];
    complete_evaluation: {
      Overall_Progress: string;
      Sales_Strategy: string;
      Customer_Journey: string;
      Technical_Accuracy: string;
      Key_successful_moments_in_the_conversation: string;
      Critical_missed_opportunities: string;
      "Pattern_analysis_of_effective/ineffective_techniques_used": string;
      Recommendations_for_future_conversations: string;
    };
    complete_rating: {
      overall_progress: { score: number; max: number };
      sales_strategy: { score: number; max: number };
      customer_journey: { score: number; max: number };
      technical_accuracy: { score: number; max: number };
      total: { score: number; max: number };
    };
    additional_criteria_evaluation: {
      distraction_handling: string;
    };
    is_complete: boolean;
    test_configuration_id: string;
  };
  created_at: string;
  updated_at: string;
}

interface SessionFeedbackDisplayProps {
  session: ConversationEvaluation;
  onBack: () => void;
}

const SessionFeedbackDisplay: React.FC<SessionFeedbackDisplayProps> = ({ session, onBack }) => {
  const { evaluation_data, conversation_data, created_at } = session;

  // Helper function to format rating keys for display
  const formatRatingKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper functions to safely get values
  const getRatingValue = (rating: any) => {
    if (!rating || typeof rating !== 'object') return { score: 0, max: 0 };
    return {
      score: rating.score || 0,
      max: rating.max || 0
    };
  };

  const formatEvaluationValue = (value: any) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  };

  const renderRating = (rating: any) => {
    const { score, max } = getRatingValue(rating);
    const percentage = max > 0 ? (score / max) * 100 : 0;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium">{score}/{max}</span>
        </div>
        <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="hover:bg-slate-100 text-sm">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <p className="text-sm text-slate-500">{formatDate(session.created_at)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center text-lg">
                <Star className="h-5 w-5 mr-2 text-yellow-500" />
                Overall Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {session.evaluation_data.complete_rating && (
                <div className="space-y-4">
                  {Object.entries(session.evaluation_data.complete_rating)
                    .filter(([key]) => key !== 'total')
                    .map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600">{formatRatingKey(key)}</span>
                          <div className="w-1/2">
                            {renderRating(value)}
                          </div>
                        </div>
                      </div>
                    ))}
                  {evaluation_data.complete_rating.total && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center text-sm font-semibold">
                        <span>Total Score</span>
                        <div className="w-1/2">
                          {renderRating(evaluation_data.complete_rating.total)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center text-lg">
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                Complete Evaluation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {Object.entries(evaluation_data.complete_evaluation || {}).map(([key, value]) => (
                  <div key={key}>
                    <h3 className="font-medium text-slate-900 mb-2">{key.replace(/_/g, ' ')}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{formatEvaluationValue(value)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center text-lg">
                <MessageCircle className="h-5 w-5 mr-2 text-indigo-500" />
                Conversation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[400px]">
                {conversation_data.pairs.map((pair, index) => (
                  <div key={index} className="p-4 border-b last:border-b-0">
                    <div className="space-y-3">
                      <div className="bg-blue-50/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-blue-800 mb-1">Visitor</p>
                        <p className="text-sm text-slate-700">{pair.visitor_text}</p>
                      </div>
                      <div className="bg-green-50/50 rounded-lg p-3">
                        <p className="text-xs font-medium text-green-800 mb-1">Salesperson</p>
                        <p className="text-sm text-slate-700">{pair.salesperson_text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {evaluation_data.individual_evaluations?.length > 0 && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-lg">
                  <Clock className="h-5 w-5 mr-2 text-blue-500" />
                  Exchange Evaluations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {evaluation_data.individual_evaluations.map((ind_eval, index) => (
                    <div key={index} className="p-4 border-b last:border-b-0">
                      <div className="mb-3">
                        <h4 className="font-medium text-sm mb-2">Exchange {index + 1}</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ind_eval.rating || {}).map(([key, value]) => (
                            <span key={key} className="inline-flex items-center px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded">
                              {key.replace(/_/g, ' ')}: {value.score}/{value.max}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{ind_eval.evaluation}</p>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {evaluation_data.additional_criteria_evaluation && (
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="flex items-center text-lg">
                  <AlertCircle className="h-5 w-5 mr-2 text-purple-500" />
                  Additional Criteria
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[575px]">
                  <div className="p-4">
                    {Object.entries(evaluation_data.additional_criteria_evaluation).map(([key, value]) => (
                      <div key={key} className="mb-4 last:mb-0">
                        <h3 className="font-medium text-sm text-slate-900 mb-1">{key.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-slate-600">{value}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionFeedbackDisplay;