import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { visitorPersonaFields, VISITOR_PERSONA_OPTIONS } from "@/data/visitPersona";
import { VisitorPersona } from "@/types/testconfig";

interface VisitorPersonaSectionProps {
  visitorPersona: VisitorPersona;
  onFieldChange: (field: keyof VisitorPersona, value: string) => void;
  isLoading: boolean;
}


export const VisitorPersonaSection: React.FC<VisitorPersonaSectionProps> = ({
  visitorPersona,
  onFieldChange,
  isLoading,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Visitor Persona</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {visitorPersonaFields.map((fieldItem) => (
          <div key={fieldItem.key} className="grid gap-1">
            <div>
              <Label htmlFor={fieldItem.key}>
                {fieldItem.label}
              </Label>
              <p className="text-xs text-muted-foreground -mt-1">
                {fieldItem.description}
              </p>
            </div>
            <Select
              value={visitorPersona[fieldItem.key as keyof VisitorPersona] || ""}
              onValueChange={(value) =>
                onFieldChange(fieldItem.key as keyof VisitorPersona, value)
              }
              disabled={isLoading}
            >
              <SelectTrigger id={fieldItem.key}>
                <SelectValue
                  placeholder={`Select ${fieldItem.label}`}
                />
              </SelectTrigger>
              <SelectContent>
                {VISITOR_PERSONA_OPTIONS[fieldItem.key as keyof typeof VISITOR_PERSONA_OPTIONS].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
};
