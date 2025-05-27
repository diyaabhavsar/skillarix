
import Navbar from "@/components/Navbar";
import PracticeSessionContainer from "@/components/practice/PracticeSessionContainer";

const PracticeSessionPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Final Session</h1>
          <p className="text-muted-foreground">
            Demonstrate your sales skills in this final evaluation
          </p>
        </div>
        
        <PracticeSessionContainer />
      </main>
    </div>
  );
};

export default PracticeSessionPage;
