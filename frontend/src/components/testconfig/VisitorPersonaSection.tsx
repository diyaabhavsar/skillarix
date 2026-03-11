import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(VISITOR_PERSONA_OPTIONS as any)[fieldItem.key] ? (
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
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {((VISITOR_PERSONA_OPTIONS as any)[fieldItem.key]).map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : fieldItem.key === 'background' || fieldItem.key === 'pain_points' || fieldItem.key === 'goals' ? (
              <Textarea
                id={fieldItem.key}
                value={visitorPersona[fieldItem.key as keyof VisitorPersona] || ""}
                onChange={(e) => onFieldChange(fieldItem.key as keyof VisitorPersona, e.target.value)}
                placeholder={`Enter ${fieldItem.label}`}
                disabled={isLoading}
                className="min-h-[80px]"
              />
            ) : (
              <Input
                id={fieldItem.key}
                value={visitorPersona[fieldItem.key as keyof VisitorPersona] || ""}
                onChange={(e) => onFieldChange(fieldItem.key as keyof VisitorPersona, e.target.value)}
                placeholder={`Enter ${fieldItem.label}`}
                disabled={isLoading}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
