
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PerformanceInsights = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Performance Insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Strengths</h4>
          <ul className="text-sm space-y-1 pl-4 list-disc text-muted-foreground">
            <li>Excellent product knowledge demonstration</li>
            <li>Strong in addressing technical questions</li>
            <li>Consistent improvement in customer engagement</li>
          </ul>
        </div>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Areas to Improve</h4>
          <ul className="text-sm space-y-1 pl-4 list-disc text-muted-foreground">
            <li>Focus more on business benefits vs technical features</li>
            <li>Develop stronger objection handling techniques</li>
            <li>Work on concise explanations of complex concepts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceInsights;
