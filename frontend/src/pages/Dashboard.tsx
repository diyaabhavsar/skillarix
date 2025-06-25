import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BarChart2, Package, Play, Users, CheckCircle } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

// Import new component files
import MetricsOverview from "@/components/dashboard/MetricsOverview";
import SessionHistoryTable from "@/components/dashboard/SessionHistoryTable";

const statCards = [
  {
    title: "Total Sessions",
    value: 42,
    icon: <BarChart2 className="w-6 h-6 text-blue-500" />,
  },
  {
    title: "Products",
    value: 3,
    icon: <Package className="w-6 h-6 text-purple-500" />,
  },
  {
    title: "Practice Completed",
    value: 18,
    icon: <CheckCircle className="w-6 h-6 text-green-500" />,
  },
  {
    title: "Average Score",
    value: "74%",
    icon: <BarChart2 className="w-6 h-6 text-yellow-500" />,
  },
];

// Demo recent sessions data
const recentSessions = [
  {
    id: 1,
    productName: "CloudGuard Pro",
    date: "May 13, 2023",
    score: 82,
    duration: "15m 24s",
    questions: 8,
  },
  {
    id: 2,
    productName: "CloudGuard Pro",
    date: "May 11, 2023",
    score: 75,
    duration: "12m 08s",
    questions: 8,
  },
  {
    id: 3,
    productName: "DataSync 360",
    date: "May 9, 2023",
    score: 68,
    duration: "16m 42s",
    questions: 8,
  },
];

function getScoreColor(score) {
  if (score > 70) return "bg-green-100 text-green-800";
  if (score >= 30) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Remove handleStartPractice check for products, just navigate to /practice
  const handleStartPractice = () => {
    navigate("/practice");
  };

  const handleViewAllSessions = () => {
    setActiveTab("history");
  };

  return (
    <div className="container p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Card
            key={stat.title}
            className="rounded-xl border shadow-sm flex flex-col items-center p-4 gap-2"
          >
            <div className="flex items-center gap-2">
              {stat.icon}
              <span className="font-bold text-sm text-muted-foreground">
                {stat.title}
              </span>
            </div>
            <div className="text-3xl font-bold mt-2">{stat.value}</div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your training progress
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleStartPractice}>
            <Play className="w-4 h-4 mr-2" /> Start Practice
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsContent value="overview" className="space-y-6">
          <MetricsOverview />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Sessions */}
            <Card className="rounded-xl border shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">
                  Recent Sessions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 px-4">
                  <div className="flex flex-col gap-4 py-4">
                    {recentSessions.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <div className="font-medium">{s.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(s.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={getScoreColor(s.score)}>
                            {s.score}%
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {s.duration}
                          </span>
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

            {/* Progress/Insights */}
            <Card className="rounded-xl border shadow-sm flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold">
                  Performance Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* You can add a chart or insights here */}
                <div className="text-muted-foreground">
                  Your average score is improving. Keep practicing to boost your
                  performance!
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <SessionHistoryTable
            sessions={[...recentSessions, ...recentSessions]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
