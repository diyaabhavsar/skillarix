import React from "react";
import { Test } from "@/types/testconfig";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserCircle } from "lucide-react";

interface VisitorPersonaDialogProps {
  test: Test;
  formatValue: (value: string) => string;
}

const VisitorPersonaDialog: React.FC<VisitorPersonaDialogProps> = ({
  test,
  formatValue,
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          <span>Persona</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Visitor Persona Details</DialogTitle>
          <DialogDescription>
            Detailed information about the visitor persona for this test.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {Object.entries(test.visitorPersona).map(
            ([key, value]) =>
              key !== "category" && (
                <div
                  key={key}
                  className="grid grid-cols-2 items-center gap-4"
                >
                  <div className="font-medium">
                    {formatValue(key)}
                  </div>
                  <div>{formatValue(value)}</div>
                </div>
              )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisitorPersonaDialog;