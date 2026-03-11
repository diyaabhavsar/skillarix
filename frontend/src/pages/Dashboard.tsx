"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { BarChart2, Package, Play, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Optional custom components
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import SessionHistoryTable from "@/components/dashboard/SessionHistoryTable";

// Stat data
const statCards = [
  {
    title: "Total Sessions",
    value: 42,
    icon: <BarChart2 className="w-5 h-5 text-blue-500" />,
  },
  {
    title: "Products",
    value: 3,
    icon: <Package className="w-5 h-5 text-purple-500" />,
  },
  {
    title: "Practice Completed",
    value: 18,
    icon: <CheckCircle className="w-5 h-5 text-green-500" />,
  },
  {
    title: "Average Score",
    value: "74%",
    icon: <BarChart2 className="w-5 h-5 text-yellow-500" />,
  },
];

// Recent Sessions Mock (with questions field for SessionData type)
const initialSessions = [
  {
    id: 1,
    productName: "CloudGuard Pro",
    date: "2023-05-13",
    score: 82,
    duration: "15m 24s",
    questions: 10,
  },
  {
    id: 2,
    productName: "CloudGuard Pro",
    date: "2023-05-11",
    score: 75,
    duration: "12m 08s",
    questions: 8,
  },
  {
    id: 3,
    productName: "DataSync 360",
    date: "2023-05-09",
    score: 68,
    duration: "16m 42s",
    questions: 12,
  },
];

function getScoreColor(score: number) {
  if (score > 70) return "bg-green-100 text-green-800";
  if (score >= 30) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState(initialSessions);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleStartPractice = () => {
    navigate("/practice");
  };

  const handleDeleteSession = async (id: number | string) => {
    // In a real application, you would make an API call here:
    // await api.delete(`/elevenlabs/transcript/${id}`);

    setSessions((prev) => prev.filter((s) => s.id !== id));
    toast({
      title: "Session Deleted",
      description: "The assessment record has been removed.",
    });
  };

  return (
    <div className="container px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Monitor your training progress and practice more to improve
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleStartPractice}>
            <Play className="w-4 h-4 mr-2" /> Start Practice
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="rounded-xl border shadow-sm p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-sm text-muted-foreground font-medium mb-2">
              {stat.title}
              {stat.icon}
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  <div className="space-y-4 py-4">
                    {sessions.slice(0, 3).map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between border-b pb-3 last:border-b-0"
                      >
                        <div>
                          <p className="font-medium">{s.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={getScoreColor(s.score)}>
                            {s.score}%
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {s.duration}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <Button
                  variant="ghost"
                  className="w-full mt-4"
                  onClick={() => setActiveTab("history")}
                >
                  View All Sessions
                </Button>
              </CardContent>
            </Card>

            {/* Insights */}
            <Card className="rounded-xl border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-bold">
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground">
                  Your average score is improving steadily. Keep practicing to
                  reach your goal!
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Session History Tab */}
        <TabsContent value="history" className="space-y-6">
          <SessionHistoryTable
            sessions={sessions}
            onDelete={handleDeleteSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
