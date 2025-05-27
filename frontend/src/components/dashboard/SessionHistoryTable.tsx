
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionData = {
  id: number;
  productName: string;
  date: string;
  score: number;
  duration: string;
  questions: number;
};

type SessionHistoryTableProps = {
  sessions: SessionData[];
};

const SessionHistoryTable = ({ sessions }: SessionHistoryTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Session History</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session, i) => (
              <TableRow key={`${session.id}-${i}`}>
                <TableCell className="font-medium">{session.productName}</TableCell>
                <TableCell>{session.date}</TableCell>
                <TableCell>{session.duration}</TableCell>
                <TableCell>{session.questions}</TableCell>
                <TableCell className="font-medium">{session.score}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default SessionHistoryTable;
