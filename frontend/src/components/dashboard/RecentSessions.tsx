
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionData = {
  id: number;
  productName: string;
  date: string;
  score: number;
  duration: string;
  questions: number;
};

type RecentSessionsProps = {
  sessions: SessionData[];
  onViewAllClick: () => void;
};

const RecentSessions = ({ sessions, onViewAllClick }: RecentSessionsProps) => {
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Practice Sessions</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onViewAllClick}>
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {sessions.map((session) => (
            <div 
              key={session.id}
              className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-md transition-colors"
            >
              <div>
                <div className="font-medium text-sm">{session.productName}</div>
                <div className="text-xs text-muted-foreground">{session.date} · {session.duration}</div>
              </div>
              <div className="text-sm font-medium">{session.score}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSessions;
