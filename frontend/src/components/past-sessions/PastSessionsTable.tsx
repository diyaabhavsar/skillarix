import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import SessionFeedbackDisplay from "./SessionFeedbackDisplay";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConversationEvaluation } from "@/types/conversations";

interface PastSessionsTableProps {
  sessions: ConversationEvaluation[];
}

const PastSessionsTable: React.FC<PastSessionsTableProps> = ({ sessions = [] }) => {
  const [selectedSession, setSelectedSession] = useState<ConversationEvaluation | null>(null);
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
        if (!a.created_at) return 1;  // Move items without dates to the end
        if (!b.created_at) return -1;
        
        // Parse dates and compare timestamps
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        
        // Sort in descending order (newest first)
        return dateB - dateA;
      });
    } catch (error) {
      console.error('Error sorting sessions:', error);
      return sessions; // Return original array in case of error
    }
  }, [sessions]);

  // Log the sorted order to verify it's working correctly
  React.useEffect(() => {
    if (sortedSessions.length > 0) {
      console.log(`Sessions sorted, displaying ${sortedSessions.length} items from newest to oldest`);
      
      // Log first and last dates to confirm sorting
      const firstDate = new Date(sortedSessions[0]?.created_at).toLocaleString();
      const lastDate = new Date(sortedSessions[sortedSessions.length-1]?.created_at).toLocaleString();
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
          overall_progress: session.evaluation_data.complete_rating?.overall_progress || { score: 0, max: 0 },
          sales_strategy: session.evaluation_data.complete_rating?.sales_strategy || { score: 0, max: 0 },
          customer_journey: session.evaluation_data.complete_rating?.customer_journey || { score: 0, max: 0 },
          technical_accuracy: session.evaluation_data.complete_rating?.technical_accuracy || { score: 0, max: 0 },
          total: session.evaluation_data.complete_rating?.total || { score: 0, max: 0 },
        },
        complete_evaluation: session.evaluation_data.complete_evaluation || {},
      }
    };
  };

  if (!sortedSessions?.length) {
    return (
      <div className="rounded-lg border p-4 text-center text-muted-foreground">
        No practice sessions found
      </div>
    );
  }

  return (
    <>
      <div className="bg-card rounded-lg border shadow">
        <Table>
          <TableCaption>A list of your past practice sessions</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                Date & Time
                <span className="ml-1 inline-block text-xs text-muted-foreground">
                  (newest first)
                </span>
              </TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Test Name</TableHead>
              <TableHead className="text-center">Questions</TableHead>
              <TableHead className="text-center">Score</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSessions.map((session) => {
      
              const totalScore =
                session.evaluation_data.complete_rating?.total?.score || 0;
              const maxScore =
                session.evaluation_data.complete_rating?.total?.max || 100;
              const isCompleted = session.evaluation_data.is_complete;
              const date = new Date(session.created_at);
              const formattedDate = date.toLocaleDateString();
              const formattedTime = date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <TableRow key={session._id}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>{session.cat_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>{session.prod_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {session.test_name}
                  </TableCell>
                  <TableCell className="text-center">
                    {session.conversation_data.pairs.length}
                  </TableCell>
                  <TableCell className="text-center">
                    {isCompleted ? (
                      <span
                        className={`font-medium ${
                          totalScore >= 80
                            ? "text-green-600"
                            : totalScore >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {totalScore}/{maxScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={isCompleted ? "default" : "secondary"}
                      className={`${
                        isCompleted
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {isCompleted ? "Completed" : "In Progress"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() => viewFeedback(session)}
                      disabled={!isCompleted}
                    >
                      View Feedback
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
