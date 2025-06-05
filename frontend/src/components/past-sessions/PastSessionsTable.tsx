
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, FileText } from "lucide-react";
import SessionFeedbackDisplay from "./SessionFeedbackDisplay";
import { useState } from "react";

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
      Pattern_analysis_of_effective_ineffective_techniques_used: string;
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

interface PastSessionsTableProps {
  sessions: ConversationEvaluation[];
}

const PastSessionsTable = ({ sessions }: PastSessionsTableProps) => {
  const [selectedSession, setSelectedSession] = useState<ConversationEvaluation | null>(null);

  const viewFeedback = (session: ConversationEvaluation) => {
    setSelectedSession(session);
  };

  if (selectedSession) {
    return <SessionFeedbackDisplay session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <div className="bg-card rounded-lg border shadow">
      <Table>
        <TableCaption>A list of your past practice sessions</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date & Time</TableHead>
            <TableHead>Product File</TableHead>
            <TableHead className="text-center">Score</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const totalScore = session.evaluation_data.complete_rating?.total?.score || 0;
            const maxScore = session.evaluation_data.complete_rating?.total?.max || 100;
            const isCompleted = session.evaluation_data.is_complete;
            const date = new Date(session.created_at);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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
                <TableCell>
                  <div className="flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>{session.product_id}</span>
                  </div>
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
  );
};

export default PastSessionsTable;
