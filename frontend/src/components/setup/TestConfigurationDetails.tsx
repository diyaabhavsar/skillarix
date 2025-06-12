import React from "react";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Test } from "@/hooks/useTests";
interface Props {
  test: Test;
  formatDate: (date: string) => string;
  formatValue: (value: string) => string;
  getProductName: (productId: string) => string;
}

const TestConfigurationDetails = ({
  test,
  formatDate,
  formatValue,
  getProductName,
}: Props) => {
  return (
    <SheetContent side="right" className="w-full sm:max-w-lg">
      <SheetHeader className="pb-4">
        <SheetTitle>Test Configuration Details</SheetTitle>
      </SheetHeader>
      <div className="space-y-6 overflow-y-auto h-[calc(100vh-8rem)]">
        {/* Basic Information */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="text-lg">{test.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Product</Label>
              <p className="text-lg">{getProductName(test.product_id)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Created At
              </Label>
              <p className="text-lg">{formatDate(test.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Visitor Persona */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Visitor Persona</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Product Knowledge
              </Label>{" "}
              <p className="text-xs text-muted-foreground -mt-2">
                How much they've heard about the product before today
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.product_knowledge)}
              </p>
            </div>
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Product Familiarity
              </Label>{" "}
              <p className="text-xs text-muted-foreground -mt-1">
                How they've interacted with or experienced it
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.product_familiarity)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Technical Expertise
              </Label>{" "}
              <p className="text-[10px] text-muted-foreground italic">
                How comfortable they are with product-related details
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.technical_expertise)}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Key Challenges
              </Label>{" "}
              <p className="text-[10px] text-muted-foreground italic">
                Their primary concern or pain point
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.key_challenges)}
              </p>
            </div>
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Buying Objective
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Their main "why" today
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.buying_objective)}
              </p>
            </div>
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Budget Range
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Their rough spend capacity
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.budget_range)}
              </p>
            </div>
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Decision Authority
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Their role in the purchase process
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.decision_authority)}
              </p>
            </div>
            <div className="space-y-2">
              {" "}
              <Label className="text-muted-foreground text-sm">
                Exhibition Objective
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                What they want to achieve at your booth
              </p>
              <p className="text-lg">
                {formatValue(test.visitorPersona.exhibition_objective)}
              </p>
            </div>
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
