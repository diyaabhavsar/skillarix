import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/utils/api";

const MetricsOverview = () => {
  const [stats, setStats] = useState({
    total_sessions: 0,
    average_score: 0,
    products_active: 0,
    sessions_this_week: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get("/conversations/stats");
        // @ts-ignore - Handle type safety later
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Practice Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.total_sessions}</div>
          <p className="text-xs text-muted-foreground mt-1">Total completed assessments</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.average_score}%</div>
          <p className="text-xs text-muted-foreground mt-1">Across all products</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Active Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.products_active}</div>
          <p className="text-xs text-muted-foreground mt-1">Products being trained</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsOverview;
