import React, { useState, useMemo, useCallback } from "react";
import { Calendar, Clock, FileText } from "lucide-react";

import ShadcnTable, {
  ShadcnColumn,
  renderScore,
  renderStatus,
  renderAction,
} from "@/components/ui/shadcn-table";
import { ConversationEvaluation, Rating } from "@/types/conversations";

import { FeedbackViewButton } from "./FeedbackViewButton";

// Memoized date renderer component
const DateTimeRenderer = React.memo(({ value }: { value: string }) => {
  const date = new Date(value);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  
  return (
    <div className="flex flex-col">
      <div className="flex items-center text-sm font-medium">
        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
        {formattedDate}
      </div>
      <div className="flex items-center text-xs text-muted-foreground mt-1">
        <Clock className="mr-2 h-3 w-3" />
        {formattedTime}
      </div>
    </div>
  );
});

DateTimeRenderer.displayName = 'DateTimeRenderer';

// Memoized product renderer component
const ProductRenderer = React.memo(({ value }: { value: string }) => (
  <div className="flex items-center">
    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
    <span>{value}</span>
  </div>
));

ProductRenderer.displayName = 'ProductRenderer';

interface PastSessionsTableProps {
  sessions: ConversationEvaluation[];
}

const PastSessionsTable = React.memo<PastSessionsTableProps>(({
  sessions = [],
}) => {
  // All hooks at the top level
  const processSessionData = useCallback((session: ConversationEvaluation): ConversationEvaluation => {
    const defaultRating: Rating = { score: 0, max: 0 };
    const defaultEvaluation = {
      Overall_Progress: '',
      Sales_Strategy: '',
      Customer_Journey: '',
      Technical_Accuracy: '',
      Key_successful_moments_in_the_conversation: '',
      Critical_missed_opportunities: '',
      "Pattern_analysis_of_effective/ineffective_techniques_used": '',
      Recommendations_for_future_conversations: '',
    };
    
    return {
      ...session,
      evaluation_data: {
        ...session.evaluation_data,
        complete_rating: {
          ...(session.evaluation_data.complete_rating || {}),
          overall_progress: session.evaluation_data.complete_rating?.overall_progress || defaultRating,
          sales_strategy: session.evaluation_data.complete_rating?.sales_strategy || defaultRating,
          customer_journey: session.evaluation_data.complete_rating?.customer_journey || defaultRating,
          technical_accuracy: session.evaluation_data.complete_rating?.technical_accuracy || defaultRating,
          total: session.evaluation_data.complete_rating?.total || defaultRating,
        },
        complete_evaluation: session.evaluation_data.complete_evaluation || defaultEvaluation,
        individual_evaluations: session.evaluation_data.individual_evaluations || [],
        mid_evaluations: session.evaluation_data.mid_evaluations || [],
        is_complete: session.evaluation_data.is_complete || false,
        additional_criteria_evaluation: session.evaluation_data.additional_criteria_evaluation || { distraction_handling: '' },
        test_configuration_id: session.evaluation_data.test_configuration_id || '',
      },
    };
  }, []);

  const sortedSessions = useMemo(() => {
    if (!sessions?.length) return [];
    
    return [...sessions].sort((a, b) => {
      if (!a.created_at) return 1;
      if (!b.created_at) return -1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [sessions]);



  const columns = useMemo<ShadcnColumn<ConversationEvaluation>[]>(() => [
    {
      key: "created_at",
      header: "Date & Time",
      className: "w-[180px]",
      headerClassName: "w-[180px]",
      render: (value) => <DateTimeRenderer value={value} />,
    },
    {
      key: "cat_name",
      header: "Category",
    },
    {
      key: "prod_name",
      header: "Product",
      render: (value) => <ProductRenderer value={value} />,
    },
    {
      key: "test_name",
      header: "Test Name",
      className: "font-medium",
    },
    {
      key: "conversation_data",
      header: "Questions",
      className: "text-center",
      render: (value) => value.pairs.length,
    },
    {
      key: "evaluation_data",
      header: "Score",
      className: "text-center",
      render: (value) => {
        const totalScore = value.complete_rating?.total?.score || 0;
        const maxScore = value.complete_rating?.total?.max || 100;
        return value.is_complete ? (
          renderScore(totalScore, maxScore)
        ) : (
          <span className="text-muted-foreground">-</span>
        );
      },
    },
    {
      key: "evaluation_data",
      header: "Status",
      className: "text-center",
      render: (value) => renderStatus(value.is_complete ? "Completed" : "In Progress"),
    },
    {
      key: "evaluation_data",
      header: "Actions",
      className: "text-right",
      render: (value, row) => value.is_complete ? (
        <FeedbackViewButton 
          sessionId={row._id} 
          session={processSessionData(row)} 
          className="w-full justify-center" 
        />
      ) : (
        <span className="text-muted-foreground italic text-sm">Not completed</span>
      ),
    },
  ], [processSessionData]);

  // Render table with empty state handled by ShadcnTable
  return (
    <div className="bg-card rounded-lg border shadow">
      <ShadcnTable
        columns={columns}
        data={sortedSessions}
        className="w-full"
        emptyMessage="No practice sessions found"
      />
    </div>
  );
});

PastSessionsTable.displayName = 'PastSessionsTable';

export default PastSessionsTable; // Remove extra memo since component is already memoized
