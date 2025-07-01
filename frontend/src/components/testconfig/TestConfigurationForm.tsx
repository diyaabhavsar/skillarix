import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import {
  type VisitorPersona,
  type AdditionalCriteria,
  TestConfigurationFormProps,
} from "@/types/testconfig";
import { toast } from "sonner";
import { useTests } from "@/hooks/useTests";
import { BasicInformationSection } from "./BasicInformationSection";
import { VisitorPersonaSection } from "./VisitorPersonaSection";
import { AdditionalCriteriaSection } from "./AdditionalCriteriaSection";
import { capitalizeWords } from "@/utils/textFormatting";

const defaultVisitorPersona: VisitorPersona = {
  product_knowledge: "",
  product_familiarity: "",
  technical_expertise: "",
  key_challenges: "",
  buying_objective: "",
  budget_range: "",
  decision_authority: "",
  exhibition_objective: "",
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
    category_id: initialData?.category_id || "",
    visitorPersona: {
      ...defaultVisitorPersona,
      category: initialData?.category_id || "",
      ...(initialData?.visitorPersona || {}),
    },
    additionalCriteria:
      initialData?.additionalCriteria || defaultAdditionalCriteria,
  });
  const {
    products,
    categories,
    fetchProductsByCategory,
    fetchAllProducts,
    isLoading: productsLoading,
  } = useProducts();
  const { createTest, updateTest } = useTests();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Combined loading state for any operation
  const isLoading = isSubmitting || productsLoading;

  // Load products when category changes
  const handleCategoryChange = async (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
      visitorPersona: {
        ...prev.visitorPersona,
        category: categoryId,
      },
      product_id: "",
    }));

    if (categoryId) {
      await fetchProductsByCategory(categoryId);
    }
  };

  // Initial load of products for the default category
  useEffect(() => {
    const loadInitialProducts = async () => {
      if (initialData?.category_id) {
        await fetchProductsByCategory(initialData.category_id);
      } else if (initialData?.product_id) {
        await fetchAllProducts();
        const product = products.find((p) => p._id === initialData.product_id);
        if (product) {
          await fetchProductsByCategory(product.category_id);
        }
      }
    };
    loadInitialProducts();
  }, [initialData]);

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
      const formattedFormData = {
        ...formData,
        name: capitalizeWords(formData.name),
      };
      if (initialData?.id) {
        await updateTest(initialData.id, formattedFormData);
      } else {
        await createTest(formattedFormData);
      }
      onSuccess?.();
      // Close the sheet by simulating escape key
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (error) {
      console.error("Error saving test configuration:", error);
      toast.error(`Failed to save test configuration: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
      <div className="grid gap-4">
        <BasicInformationSection
          name={formData.name}
          isAssessmentPresent={initialData?.assessment || false}
          categoryId={formData.visitorPersona.category}
          productId={formData.product_id}
          categories={categories}
          products={products}
          onNameChange={(value) =>
            setFormData((prev) => ({ ...prev, name: value }))
          }
          onCategoryChange={handleCategoryChange}
          onProductChange={(value) =>
            setFormData((prev) => ({ ...prev, product_id: value }))
          }
          isLoading={isLoading}
        />

        <VisitorPersonaSection
          visitorPersona={formData.visitorPersona}
          onFieldChange={handleVisitorPersonaChange}
          isLoading={isLoading}
        />

        <AdditionalCriteriaSection
          criteria={formData.additionalCriteria}
          onCriteriaChange={handleCriteriaChange}
          isLoading={isLoading}
        />
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
