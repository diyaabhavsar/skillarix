
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionState } from "@/hooks/useSessionState";
import FilterSettingsComponent from "./session/FilterSettings";
import ConversationMessages from "./session/ConversationMessages";
import MessageInput from "./session/MessageInput";

type PracticeSessionProps = {
  productName: string;
  onEndSession: () => void;
};

const PracticeSession = ({ productName, onEndSession }: PracticeSessionProps) => {
  const {
    messages,
    response,
    isEvaluating,
    questionCount,
    filterSettings,
    setResponse,
    handleSubmit,
    handleFilterChange,
    toggleFocusArea,
    resetFilters
  } = useSessionState(productName);

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-y-auto mb-4 border-0 shadow-md">
        <CardHeader className="sticky top-0 z-10 bg-card backdrop-blur-sm bg-opacity-80 border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Final Session: {productName}</CardTitle>
              <CardDescription>
                Respond to customer questions naturally as you would in a real scenario
              </CardDescription>
            </div>
            
            <FilterSettingsComponent 
              filterSettings={filterSettings}
              handleFilterChange={handleFilterChange}
              toggleFocusArea={toggleFocusArea}
              resetFilters={resetFilters}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <ConversationMessages 
            messages={messages} 
            isEvaluating={isEvaluating} 
          />
        </CardContent>
      </Card>
      
      <MessageInput
        response={response}
        setResponse={setResponse}
        handleSubmit={handleSubmit}
        isEvaluating={isEvaluating}
      />
      
      <div className="flex justify-between mt-4">
        <Button variant="outline" size="sm" onClick={onEndSession}>
          End Final Session
        </Button>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <span>Question</span>
          <span className="font-semibold">{questionCount}/{filterSettings.questionCount}</span>
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
