
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MetricsOverview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Total Practice Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">24</div>
          <p className="text-xs text-muted-foreground mt-1">5 sessions this week</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Average Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">72%</div>
          <p className="text-xs text-green-500 mt-1">+8% from last week</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">Product Knowledge</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">3</div>
          <p className="text-xs text-muted-foreground mt-1">Products being trained</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetricsOverview;
