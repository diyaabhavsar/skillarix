
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

interface PastSession {
  id: string;
  date: string;
  time: string;
  product: string;
  totalScore: number;
  status: "completed" | "in-progress";
}

interface PastSessionsTableProps {
  sessions: PastSession[];
}

const PastSessionsTable = ({ sessions }: PastSessionsTableProps) => {
  const navigate = useNavigate();

  const viewFeedback = (sessionId: string) => {
    navigate(`/feedback/${sessionId}`);
  };

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
          {sessions.map((session) => (
            <TableRow key={session.id}>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center text-sm font-medium">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    {session.date}
                  </div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Clock className="mr-2 h-3 w-3" />
                    {session.time}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{session.product}</span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                {session.status === "completed" ? (
                  <span 
                    className={`font-medium ${
                      session.totalScore >= 80 
                        ? "text-green-600" 
                        : session.totalScore >= 60 
                          ? "text-amber-600" 
                          : "text-red-600"
                    }`}
                  >
                    {session.totalScore}/100
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge 
                  variant={session.status === "completed" ? "default" : "secondary"}
                  className={`${
                    session.status === "completed" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {session.status === "completed" ? "Completed" : "In Progress"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  onClick={() => viewFeedback(session.id)}
                  disabled={session.status !== "completed"}
                >
                  View Feedback
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PastSessionsTable;
