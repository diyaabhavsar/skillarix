import { Button } from "../ui/button";
import { useNavigate } from "react-router-dom";

const PracticeHeader = () => {
  const navigate = useNavigate();

  const handleStartNewSession = () => {
    navigate("/session/setup");
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assessment History</h1>
          <p className="text-muted-foreground">
            Review your past assessment and performance
          </p>
        </div>
        <Button
          onClick={handleStartNewSession}
          size="lg"
          className="px-6"
        >
          New Session
        </Button>
      </div>
    </div>
  );
};

export default PracticeHeader;
