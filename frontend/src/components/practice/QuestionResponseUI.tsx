
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Question } from "@/types/practice";
import CustomerQuestion from "./CustomerQuestion";
import SalespersonResponse from "./SalespersonResponse";
import EvaluationFeedback from "./EvaluationFeedback";
import ModelAnswer from "./ModelAnswer";
import SessionNavigation from "./SessionNavigation";

interface QuestionResponseUIProps {
  currentQuestion: Question;
  userResponse: string;
  step: "question" | "response" | "evaluation";
  currentQuestionIndex: number;
  questionsLength: number;
  isEndConfirmOpen: boolean;
  setIsEndConfirmOpen: (isOpen: boolean) => void;
  handleResponseChange: (response: string) => void;
  submitResponse: () => void;
  handleStartResponse: () => void;
  goToPreviousQuestion: () => void;
  goToNextQuestion: () => void;
  handleEndSession: () => void;
}

const QuestionResponseUI = ({
  currentQuestion,
  userResponse,
  step,
  currentQuestionIndex,
  questionsLength,
  isEndConfirmOpen,
  setIsEndConfirmOpen,
  handleResponseChange,
  submitResponse,
  handleStartResponse,
  goToPreviousQuestion,
  goToNextQuestion,
  handleEndSession
}: QuestionResponseUIProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <Card className="mb-4">
        <CardContent className="pt-6">
          <CustomerQuestion question={currentQuestion.content} />
        </CardContent>
      </Card>
      
      {step === "question" && (
        <div className="flex justify-between mt-6">
          <div className="flex-1">
            <Button onClick={handleStartResponse}>
              Start Your Response
            </Button>
          </div>
          <div>
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
          </div>
        </div>
      )}
      
      {step === "response" && (
        <SalespersonResponse
          value={userResponse}
          onChange={handleResponseChange}
          onSubmit={submitResponse}
        />
      )}
      
      {step === "evaluation" && currentQuestion.evaluation && (
        <div className="space-y-4">
          <EvaluationFeedback
            score={currentQuestion.evaluation.score}
            feedback={currentQuestion.evaluation.feedback}
          />
          
          <ModelAnswer modelAnswer={currentQuestion.evaluation.modelAnswer} />
          
          <SessionNavigation 
            currentQuestionIndex={currentQuestionIndex}
            questionsLength={questionsLength}
            isEndConfirmOpen={isEndConfirmOpen}
            setIsEndConfirmOpen={setIsEndConfirmOpen}
            goToPreviousQuestion={goToPreviousQuestion}
            goToNextQuestion={goToNextQuestion}
            handleEndSession={handleEndSession}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionResponseUI;
