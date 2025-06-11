import React from "react";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Test } from "@/hooks/useTests";

interface Props {
  test: Test;
  formatDate: (date: string) => string;
}

const TestConfigurationDetails = ({ test, formatDate }: Props) => {
  return (
    <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
      <SheetHeader className="pb-4">
        <SheetTitle>Test Configuration Details</SheetTitle>
      </SheetHeader>
      <div className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="text-lg">{test.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Created At
              </Label>
              <p className="text-lg">{formatDate(test.created_at)}</p>
            </div>
            {/* <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Last Updated
              </Label>
              <p className="text-lg">{formatDate(test.updated_at)}</p>
            </div> */}
          </div>
        </div>

        {/* Visitor Persona */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Visitor Persona</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Background
              </Label>
              <p className="text-lg">{test.visitorPersona.background}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Goals</Label>
              <p className="text-lg">{test.visitorPersona.goals}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Technical Knowledge
              </Label>
              <p className="text-lg">
                {test.visitorPersona.technical_knowledge}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Previous Experience
              </Label>
              <p className="text-lg">
                {test.visitorPersona.previous_experience}
              </p>
            </div>
            {test.visitorPersona.pain_points && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">
                  Pain Points
                </Label>
                <p className="text-lg">{test.visitorPersona.pain_points}</p>
              </div>
            )}
            {test.visitorPersona.budget_sensitivity && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">
                  Budget Sensitivity
                </Label>
                <p className="text-lg">
                  {test.visitorPersona.budget_sensitivity}
                </p>
              </div>
            )}
            {test.visitorPersona.decision_authority && (
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">
                  Decision Authority
                </Label>
                <p className="text-lg">
                  {test.visitorPersona.decision_authority}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Criteria */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Additional Criteria</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Distraction Handling
              </Label>
              <p className="text-lg">
                {test.additionalCriteria.distraction_handling ? "Yes" : "No"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Communication Simplicity
              </Label>
              <p className="text-lg">
                {test.additionalCriteria.communication_simplicity
                  ? "Yes"
                  : "No"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  );
};

export default TestConfigurationDetails;
