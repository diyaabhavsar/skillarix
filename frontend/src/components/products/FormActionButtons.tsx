import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export interface FormActionButtonsProps {
  onProcess: () => Promise<void>;
  isLoading: boolean;
}

const FormActionButtons = ({ onProcess, isLoading }: FormActionButtonsProps) => {
  return (
    <div className="flex justify-end gap-4">
      <Button variant="outline" asChild>
        <Link to="/dashboard">Cancel</Link>
      </Button>
      <Button onClick={onProcess} disabled={isLoading}>
        {isLoading ? "Uploading..." : "Upload & Process"}
      </Button>
    </div>
  );
};

export default FormActionButtons;
