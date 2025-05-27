
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface SessionNavigationProps {
  currentQuestionIndex: number;
  questionsLength: number;
  isEndConfirmOpen: boolean;
  setIsEndConfirmOpen: (isOpen: boolean) => void;
  goToPreviousQuestion: () => void;
  goToNextQuestion: () => void;
  handleEndSession: () => void;
}

const SessionNavigation = ({
  currentQuestionIndex,
  questionsLength,
  isEndConfirmOpen,
  setIsEndConfirmOpen,
  goToPreviousQuestion,
  goToNextQuestion,
  handleEndSession
}: SessionNavigationProps) => {
  return (
    <div className="flex justify-between mt-6">
      <Button 
        variant="outline" 
        onClick={goToPreviousQuestion}
        disabled={currentQuestionIndex === 0}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Previous
      </Button>
      
      <AlertDialog open={isEndConfirmOpen} onOpenChange={setIsEndConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">End Session</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Final Session?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to end this final session? You'll see your final evaluation results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSession}>End Session</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Button onClick={goToNextQuestion}>
        {currentQuestionIndex === questionsLength - 1 ? "Finish" : "Next"} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
};

export default SessionNavigation;
