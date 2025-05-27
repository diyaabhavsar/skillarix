// src/components/TabbedEvaluationDisplay.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EvaluationDisplay from "@/components/EvaluationDisplay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function TabbedEvaluationDisplay({
  exchanges,
  midEvaluation,
  completeEvaluation,
  additionalEvaluation,
}) {
  const [tab, setTab] = useState("individual");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="individual">Individual Exchanges</TabsTrigger>
        <TabsTrigger value="mid">Mid-Conversation Evaluations</TabsTrigger>
        <TabsTrigger value="complete">Complete Evaluation</TabsTrigger>
        <TabsTrigger value="additional">Additional Evaluation</TabsTrigger>
      </TabsList>

      {/* Individual Exchanges */}
      <TabsContent value="individual">
        {exchanges.map((ex, idx) => (
          <Card key={idx} className="mb-6">
            <CardHeader>
              <CardTitle>Exchange {idx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2">
                <b>Customer Question:</b> {ex.question}
              </div>
              <div className="mb-2">
                <b>Salesperson's Answer:</b> {ex.answer}
              </div>
              <div className="mb-2">
                <b>Reference Answer:</b> {ex.modelAnswer}
              </div>
              <div className="mb-2">
                <b>Evaluation:</b>
                <EvaluationDisplay {...ex.evaluation} />
              </div>
            </CardContent>
          </Card>
        ))}
      </TabsContent>

      {/* Mid-Conversation */}
      <TabsContent value="mid">
        {midEvaluation ? (
          <EvaluationDisplay {...midEvaluation} />
        ) : (
          <div>No mid-conversation evaluation available.</div>
        )}
      </TabsContent>

      {/* Complete */}
      <TabsContent value="complete">
        <EvaluationDisplay {...completeEvaluation} />
      </TabsContent>

      {/* Additional */}
      <TabsContent value="additional">
        {additionalEvaluation ? (
          <EvaluationDisplay {...additionalEvaluation} />
        ) : (
          <div>No additional evaluation available.</div>
        )}
      </TabsContent>
    </Tabs>
  );
}