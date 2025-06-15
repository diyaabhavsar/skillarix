import React from "react";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Test } from "@/types/testconfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { visitorPersonaFields } from "@/data/visitPersona";

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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Name</Label>
              <p className="text-base font-medium">{test.name}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Product</Label>
              <p className="text-base font-medium">{getProductName(test.product_id)}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Created At
              </Label>
              <p className="text-base font-medium">{formatDate(test.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Visitor Persona */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Visitor Persona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {visitorPersonaFields.map((field) => (
              <div className="space-y-2" key={field.key}>
                <Label className="text-muted-foreground text-sm">
                  {field.label}
                </Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  {field.description}
                </p>
                <p className="text-base font-medium">
                  {formatValue(test.visitorPersona[field.key as keyof typeof test.visitorPersona])}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Additional Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Criteria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Distraction Handling
              </Label>
              <p className="text-base font-medium">
                {test.additionalCriteria.distraction_handling ? "Yes" : "No"}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">
                Communication Simplicity
              </Label>
              <p className="text-base font-medium">
                {test.additionalCriteria.communication_simplicity
                  ? "Yes"
                  : "No"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  );
};

export default TestConfigurationDetails;
