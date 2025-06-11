import { Button } from "../ui/button";

interface PracticeHeaderProps {
  onStartNewSession: () => void;
}

const PracticeHeader = ({ onStartNewSession }: PracticeHeaderProps) => {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Session History</h1>
          <p className="text-muted-foreground">
            Review your past sessions and performance
          </p>
        </div>
        <Button
          onClick={onStartNewSession}
          size="lg"
          className="px-6"
        >
          Start New Session
        </Button>
      </div>
    </div>
  );
};

export default PracticeHeader;
