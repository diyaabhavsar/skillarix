import React, { useState } from "react";
import { Calendar, Clock, FileText } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ShadcnTable, {
  ShadcnColumn,
  renderScore,
  renderStatus,
  renderAction,
} from "@/components/ui/shadcn-table";
import { ConversationEvaluation } from "@/types/conversations";
import SessionFeedbackDisplay from "./SessionFeedbackDisplay";

interface PastSessionsTableProps {
  sessions: ConversationEvaluation[];
}

const PastSessionsTable: React.FC<PastSessionsTableProps> = ({
  sessions = [],
}) => {
  const [selectedSession, setSelectedSession] =
    useState<ConversationEvaluation | null>(null);
  const viewFeedback = (session: ConversationEvaluation) =>
    setSelectedSession(session);

  // Enhanced sorting for newest to oldest (descending order)
  const sortedSessions = React.useMemo(() => {
    try {
      // Make sure we have sessions to sort
      if (!sessions || sessions.length === 0) {
        return [];
      }

      // Sort by created_at date in descending order (newest first)
      return [...sessions].sort((a, b) => {
        // Handle nullish values
        if (!a.created_at) return 1; // Move items without dates to the end
        if (!b.created_at) return -1;

        // Parse dates and compare timestamps
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();

        // Sort in descending order (newest first)
        return dateB - dateA;
      });
    } catch (error) {
      console.error("Error sorting sessions:", error);
      return sessions; // Return original array in case of error
    }
  }, [sessions]);

  // Log the sorted order to verify it's working correctly
  React.useEffect(() => {
    if (sortedSessions.length > 0) {
      console.log(
        `Sessions sorted, displaying ${sortedSessions.length} items from newest to oldest`
      );

      // Log first and last dates to confirm sorting
      const firstDate = new Date(
        sortedSessions[0]?.created_at
      ).toLocaleString();
      const lastDate = new Date(
        sortedSessions[sortedSessions.length - 1]?.created_at
      ).toLocaleString();
      console.log(`First (newest): ${firstDate}, Last (oldest): ${lastDate}`);
    }
  }, [sortedSessions]);

  const processSessionData = (session: any) => {
    return {
      ...session,
      evaluation_data: {
        ...session.evaluation_data,
        complete_rating: {
          ...(session.evaluation_data.complete_rating || {}),
          // Ensure the rating objects are properly structured
          overall_progress: session.evaluation_data.complete_rating
            ?.overall_progress || { score: 0, max: 0 },
          sales_strategy: session.evaluation_data.complete_rating
            ?.sales_strategy || { score: 0, max: 0 },
          customer_journey: session.evaluation_data.complete_rating
            ?.customer_journey || { score: 0, max: 0 },
          technical_accuracy: session.evaluation_data.complete_rating
            ?.technical_accuracy || { score: 0, max: 0 },
          total: session.evaluation_data.complete_rating?.total || {
            score: 0,
            max: 0,
          },
        },
        complete_evaluation: session.evaluation_data.complete_evaluation || {},
      },
    };
  };

  if (!sortedSessions?.length) {
    return (
      <div className="rounded-lg border p-4 text-center text-muted-foreground">
        No practice sessions found
      </div>
    );
  }

  const columns: ShadcnColumn<ConversationEvaluation>[] = [
    {
      key: "created_at",
      header: "Date & Time",
      className: "w-[180px]",
      headerClassName: "w-[180px]",
      render: (value) => {
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
      },
    },
    {
      key: "cat_name",
      header: "Category",
    },
    {
      key: "prod_name",
      header: "Product",
      render: (value) => (
        <div className="flex items-center">
          <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
          <span>{value}</span>
        </div>
      ),
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
      render: (value) =>
        renderStatus(value.is_complete ? "Completed" : "In Progress"),
    },
    {
      key: "evaluation_data",
      header: "Actions",
      className: "text-right",
      render: (value, row) =>
        renderAction(
          "View Feedback",
          () => viewFeedback(row),
          !value.is_complete
        ),
    },
  ];

  return (
    <>
      <div className="bg-card rounded-lg border shadow">
        <ShadcnTable
          columns={columns}
          data={sortedSessions}
          className="w-full"
          emptyMessage="No practice sessions found"
        />
      </div>

      <Dialog
        open={!!selectedSession}
        onOpenChange={() => setSelectedSession(null)}
      >
        {/* <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto"> */}
        <DialogContent className="w-full h-[90vh] max-w-none max-h-[90vh] overflow-auto">
          {selectedSession && (
            <SessionFeedbackDisplay
              session={processSessionData(selectedSession)}
              onBack={() => setSelectedSession(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default React.memo(PastSessionsTable);
