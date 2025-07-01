import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Test } from "@/types/testconfig";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <SheetContent side="right" className="w-full sm:max-w-4xl">
      <SheetHeader className="pb-4">
        <SheetTitle>Test Configuration Details</SheetTitle>
      </SheetHeader>
      <div className="space-y-6 overflow-y-auto h-[calc(100vh-8rem)]">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-1.5">
                <Label htmlFor="name">Name</Label>
                <p className="text-base">{test.name}</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="product">Product</Label>
                <p className="text-base">{getProductName(test.product_id)}</p>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="created">Created At</Label>
              <p className="text-base">{formatDate(test.created_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Visitor Persona */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Visitor Persona</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {(() => {
                const fieldPairs = [];
                for (let i = 0; i < visitorPersonaFields.length; i += 2) {
                  fieldPairs.push(visitorPersonaFields.slice(i, i + 2));
                }
                return fieldPairs.map((pair, rowIndex) => (
                  <div key={rowIndex} className="grid grid-cols-2 gap-6">
                    {pair.map((field) => (
                      <div key={field.key} className="grid gap-2 p-3 rounded-lg bg-muted/30">
                        <div>
                          <Label htmlFor={field.key} className="text-sm font-medium">
                            {field.label}
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {field.description}
                          </p>
                        </div>
                        <p className="text-base font-medium">
                          {formatValue(
                            test.visitorPersona[
                              field.key as keyof typeof test.visitorPersona
                            ]
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          </CardContent>
        </Card>

        {/* Additional Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Additional Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-1.5">
                <Label htmlFor="distraction">Distraction Handling</Label>
                <p className="text-base">
                  {test.additionalCriteria.distraction_handling ? "Yes" : "No"}
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="communication">Communication Simplicity</Label>
                <p className="text-base">
                  {test.additionalCriteria.communication_simplicity ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SheetContent>
  );
};

export default TestConfigurationDetails;
