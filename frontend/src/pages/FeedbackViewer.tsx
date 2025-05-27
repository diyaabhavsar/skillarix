
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileDown } from "lucide-react";
import { usePDFExport } from "@/hooks/use-pdf-export";
import QAAnalysis from "@/components/feedback/QAAnalysis";
import MidSessionEvaluation from "@/components/feedback/MidSessionEvaluation";
import FinalAssessment from "@/components/feedback/FinalAssessment";
import { feedbackData } from "@/data/mockFeedbackData";

const FeedbackViewer = () => {
  const { sessionId } = useParams();
  const session = feedbackData; // In real app, we'd fetch based on sessionId
  const { exportToPDF, isExporting } = usePDFExport();

  const handleExportPDF = () => {
    exportToPDF('feedback-content', {
      filename: `feedback-session-${sessionId}.pdf`,
      onSuccess: () => {
        console.log("PDF exported successfully");
      },
      onError: (error) => {
        console.error("Error exporting PDF:", error);
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8" id="feedback-content">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Session Feedback</h1>
            <p className="text-muted-foreground">
              {session.product} • {session.date} at {session.time}
            </p>
          </div>
          
          <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2">
            <FileDown className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export as PDF'}
          </Button>
        </div>
        
        <Tabs defaultValue="qa" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="qa">Q&A Analysis</TabsTrigger>
            <TabsTrigger value="mid">Mid-Session Evaluations</TabsTrigger>
            <TabsTrigger value="final">Final Assessment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="qa" className="mt-6 space-y-6">
            <QAAnalysis qaHistory={session.qaHistory} />
          </TabsContent>
          
          <TabsContent value="mid" className="mt-6">
            <MidSessionEvaluation evaluations={session.midEvaluations} />
          </TabsContent>
          
          <TabsContent value="final" className="mt-6">
            <FinalAssessment evaluation={session.finalEvaluation} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FeedbackViewer;
