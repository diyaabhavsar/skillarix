import React from "react";
import { Label } from "@/components/ui/label";
import { AdditionalCriteria } from "@/types/testconfig";

interface AdditionalCriteriaSectionProps {
  criteria: AdditionalCriteria;
  onCriteriaChange: (field: keyof AdditionalCriteria) => void;
  isLoading: boolean;
}

export const AdditionalCriteriaSection: React.FC<
  AdditionalCriteriaSectionProps
> = ({ criteria, onCriteriaChange, isLoading }) => {
  return (
    <div className="grid gap-4">
      <h3 className="font-semibold">Additional Criteria</h3>
      <div className="grid gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="distraction_handling"
            checked={criteria.distraction_handling}
            onChange={() => onCriteriaChange("distraction_handling")}
            className="h-4 w-4 rounded border-gray-300"
            disabled={isLoading}
          />
          <Label htmlFor="distraction_handling">Distraction Handling</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="communication_simplicity"
            checked={criteria.communication_simplicity}
            onChange={() => onCriteriaChange("communication_simplicity")}
            className="h-4 w-4 rounded border-gray-300"
            disabled={isLoading}
          />
          <Label htmlFor="communication_simplicity">
            Communication Simplicity
          </Label>
        </div>
      </div>
    </div>
  );
};
