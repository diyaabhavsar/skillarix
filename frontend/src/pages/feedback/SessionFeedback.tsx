import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { marked } from "marked";
import { ConversationEvaluation } from '@/types/conversations';

import OverallPerformance from '@/components/feedback/OverallPerformance';
import CompleteEvaluation from '@/components/feedback/CompleteEvaluation';
import ConversationDisplay from '@/components/feedback/ConversationDisplay';
import ExchangeEvaluations from '@/components/feedback/ExchangeEvaluations';
import AdditionalCriteria from '@/components/feedback/AdditionalCriteria';
import MidEvaluations from '@/components/feedback/MidEvaluations';

const SessionFeedback: React.FC = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<ConversationEvaluation | null>(null);

  useEffect(() => {
    // Try to get the session data from sessionStorage
    console.log('Looking for session with ID:', sessionId);
    const storedSession = sessionStorage.getItem(`session-${sessionId}`);
    console.log('Found stored session:', storedSession ? 'yes' : 'no');
    
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('Successfully parsed session data');
        setSession(parsedSession);
      } catch (error) {
        console.error('Error parsing session data:', error);
        navigate('/practice');
      }
    } else {
      console.log('No session data found, redirecting to practice');
      // If no session data is found, redirect to practice page
      navigate('/practice');
    }
  }, [sessionId, navigate]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Helper function to format rating keys for display
  const formatRatingKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper functions to safely get values
  const getRatingValue = (rating: any) => {
    if (!rating || typeof rating !== "object") return { score: 0, max: 0 };
    return {
      score: rating.score || 0,
      max: rating.max || 0,
    };
  };

  const formatEvaluationValue = (value: any) => {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && !Array.isArray(value)) {
      // Render as vertical table
      return (
        <div className="border rounded bg-slate-50 p-3 my-2">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(value).map(([k, v]) => (
                <tr key={k}>
                  <td className="pr-2 py-1 font-medium align-top text-slate-700 whitespace-nowrap">
                    {k.replace(/_/g, " ")}:
                  </td>
                  <td className="py-1 text-slate-600">
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return JSON.stringify(value);
  };

  const formatEvaluationData = (value): React.ReactNode => {
    if (!value) return "";
    let inputVal: any = value;
    if (typeof value === "string") {
      try {
        inputVal = JSON.parse(value);
      } catch {
        return value; // Not a valid JSON string, return as-is
      }
    }

    if (typeof inputVal === "string") return inputVal;

    if (typeof inputVal === "object" && !Array.isArray(inputVal)) {
      return (
        <div className="border rounded bg-slate-50 p-3 my-2">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(inputVal).map(([k, v]) => {
                let displayValue: React.ReactNode;

                if (
                  typeof v === "string" ||
                  typeof v === "number" ||
                  typeof v === "boolean"
                ) {
                  displayValue = v.toString();
                } else if (typeof v === "object") {
                  try {
                    displayValue = (
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(v, null, 2)}
                      </pre>
                    );
                  } catch {
                    displayValue = "Unserializable object";
                  }
                } else {
                  displayValue = String(v);
                }

                return (
                  <tr key={k}>
                    <td className="pr-2 py-1 font-medium align-top text-slate-700 whitespace-nowrap">
                      {k.replace(/_/g, " ")}:
                    </td>
                    <td className="py-1 text-slate-600">{displayValue}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    return JSON.stringify(inputVal, null, 2);
  };

  const formatAIGeneratedText = (text) => {
    if (!text) return "";
    const cleanHTML = marked.parse(text); // Converts Markdown to HTML
    return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
  };

  // Render rating as a progress bar with score and max
  const renderRating = (rating: any) => {
    const { score, max } = getRatingValue(rating);
    const percentage = max > 0 ? (score / max) * 100 : 0;

    return (
      <div className="space-y-0.5 max-w-[200px] ml-auto">
        <div className="flex justify-end items-center text-xs">
          <span className="font-medium text-slate-600">
            {score}/{max}
          </span>
        </div>
        <div className="relative h-1 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-400/70 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const { evaluation_data, conversation_data, created_at } = session;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate('/practice')}
          className="hover:bg-slate-100 text-sm"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <p className="text-sm text-slate-500">
          {formatDate(created_at)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <OverallPerformance
            completeRating={evaluation_data.complete_rating}
            formatRatingKey={formatRatingKey}
            renderRating={renderRating}
          />
          <CompleteEvaluation
            completeEvaluation={evaluation_data.complete_evaluation}
            formatEvaluationValue={formatEvaluationValue}
          />
        </div>

        <div className="space-y-6">
          <ConversationDisplay
            conversationPairs={conversation_data.pairs}
            individualEvaluations={evaluation_data.individual_evaluations}
          />

          <ExchangeEvaluations
            evaluations={evaluation_data.individual_evaluations}
            formatEvaluationData={formatEvaluationData}
          />

          <AdditionalCriteria
            criteriaEvaluation={evaluation_data.additional_criteria_evaluation}
            formatAIGeneratedText={formatAIGeneratedText}
          />

          <MidEvaluations
            evaluations={evaluation_data.mid_evaluations}
            formatAIGeneratedText={formatAIGeneratedText}
          />
        </div>
      </div>
    </div>
  );
};

export default SessionFeedback;