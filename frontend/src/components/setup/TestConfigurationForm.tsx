import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import {
  useTests,
  type VisitorPersona,
  type AdditionalCriteria,
} from "@/hooks/useTests";
import { toast } from "sonner";

interface TestConfigurationFormProps {
  initialData?: {
    id?: string;
    name: string;
    product_id: string;
    visitorPersona: VisitorPersona;
    additionalCriteria: AdditionalCriteria;
  };
  onSuccess?: () => void;
}

const defaultVisitorPersona: VisitorPersona = {
  background: "",
  pain_points: "",
  goals: "",
  technical_knowledge: "",
  budget_sensitivity: "",
  decision_authority: "",
  previous_experience: "",
};

const defaultAdditionalCriteria: AdditionalCriteria = {
  distraction_handling: false,
  communication_simplicity: false,
};

const TestConfigurationForm: React.FC<TestConfigurationFormProps> = ({
  initialData,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    product_id: initialData?.product_id || "",
    visitorPersona: initialData?.visitorPersona || defaultVisitorPersona,
    additionalCriteria:
      initialData?.additionalCriteria || defaultAdditionalCriteria,
  });
  // Destructure what we need from useTests hook
  const { products, fetchProducts, isLoading: productsLoading } = useProducts();
  const { createTest, updateTest } = useTests();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combined loading state for any operation
  const isLoading = isSubmitting || productsLoading;

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleVisitorPersonaChange = (
    field: keyof VisitorPersona,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      visitorPersona: {
        ...prev.visitorPersona,
        [field]: value,
      },
    }));
  };

  const handleCriteriaChange = (field: keyof AdditionalCriteria) => {
    setFormData((prev) => ({
      ...prev,
      additionalCriteria: {
        ...prev.additionalCriteria,
        [field]: !prev.additionalCriteria[field],
      },
    }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.product_id) {
      if (!formData.name.trim()) toast.error("Please enter a test name.");
      if (!formData.product_id) toast.error("Please select a product.");
      return;
    }
    try {
      setIsSubmitting(true);

      if (initialData?.id) {
        // If initialData.id exists, it's an update
        await updateTest(initialData.id, formData);
      } else {
        // If no initialData.id, it's a creation
        await createTest(formData);
      }
      onSuccess?.();
      // Close the sheet by simulating escape key
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (error: any) {
      console.error("Error saving test configuration:", error);
      toast.error(`Failed to save test configuration: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 py-4 max-h-[80vh] overflow-y-auto px-1"
    >
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Test Name</Label>
          <Input
            id="name"
            placeholder="Enter test name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={isLoading}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="product">Select Product</Label>
          <Select
            value={formData.product_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, product_id: value }))
            }
            disabled={isLoading}
          >
            <SelectTrigger id="product">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Visitor Persona Fields */}
        <div className="space-y-4">
          <h3 className="font-semibold">Visitor Persona</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="background">Background</Label>
              <Input
                id="background"
                value={formData.visitorPersona.background}
                onChange={(e) =>
                  handleVisitorPersonaChange("background", e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goals">Goals</Label>
              <Input
                id="goals"
                value={formData.visitorPersona.goals}
                onChange={(e) =>
                  handleVisitorPersonaChange("goals", e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="technical_knowledge">Technical Knowledge</Label>
              <Input
                id="technical_knowledge"
                value={formData.visitorPersona.technical_knowledge}
                onChange={(e) =>
                  handleVisitorPersonaChange(
                    "technical_knowledge",
                    e.target.value
                  )
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="previous_experience">Previous Experience</Label>
              <Input
                id="previous_experience"
                value={formData.visitorPersona.previous_experience}
                onChange={(e) =>
                  handleVisitorPersonaChange(
                    "previous_experience",
                    e.target.value
                  )
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pain_points">Pain Points</Label>
              <Input
                id="pain_points"
                value={formData.visitorPersona.pain_points}
                onChange={(e) =>
                  handleVisitorPersonaChange("pain_points", e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget_sensitivity">Budget Sensitivity</Label>
              <Input
                id="budget_sensitivity"
                value={formData.visitorPersona.budget_sensitivity}
                onChange={(e) =>
                  handleVisitorPersonaChange(
                    "budget_sensitivity",
                    e.target.value
                  )
                }
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="decision_authority">Decision Authority</Label>
              <Input
                id="decision_authority"
                value={formData.visitorPersona.decision_authority}
                onChange={(e) =>
                  handleVisitorPersonaChange(
                    "decision_authority",
                    e.target.value
                  )
                }
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Additional Criteria */}
        <div className="grid gap-4">
          <h3 className="font-semibold">Additional Criteria</h3>
          <div className="grid gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="distraction_handling"
                checked={formData.additionalCriteria.distraction_handling}
                onChange={() => handleCriteriaChange("distraction_handling")}
                className="h-4 w-4 rounded border-gray-300"
                disabled={isLoading}
              />
              <Label htmlFor="distraction_handling">Distraction Handling</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="communication_simplicity"
                checked={formData.additionalCriteria.communication_simplicity}
                onChange={() =>
                  handleCriteriaChange("communication_simplicity")
                }
                className="h-4 w-4 rounded border-gray-300"
                disabled={isLoading}
              />
              <Label htmlFor="communication_simplicity">
                Communication Simplicity
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading
          ? initialData
            ? "Updating..."
            : "Creating..."
          : initialData
          ? "Update Test Configuration"
          : "Create Test Configuration"}
      </Button>
    </form>
  );
};

export default TestConfigurationForm;
