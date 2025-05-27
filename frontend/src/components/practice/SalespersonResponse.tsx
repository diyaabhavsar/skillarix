
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface SalespersonResponseProps {
  value: string;
  onChange: (response: string) => void;
  onSubmit: () => void;
}

const SalespersonResponse = ({ value, onChange, onSubmit }: SalespersonResponseProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            Y
          </div>
          <CardTitle className="text-lg">Your Response</CardTitle>
        </div>
        
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type your response to the customer..."
            className="min-h-[200px] resize-none pr-12"
          />
          <Button
            size="icon"
            className="absolute right-4 bottom-4"
            onClick={onSubmit}
            disabled={!value.trim()}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={onSubmit} disabled={!value.trim()}>
            Submit Response
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalespersonResponse;
