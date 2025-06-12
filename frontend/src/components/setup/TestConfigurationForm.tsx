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
    category_id: string;
    visitorPersona: VisitorPersona;
    additionalCriteria: AdditionalCriteria;
  };
  onSuccess?: () => void;
}

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
      category: initialData?.category_id || "", // Set the category in visitorPersona as well
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
    // Update both the category_id and visitorPersona.category
    setFormData((prev) => ({
      ...prev,
      category_id: categoryId,
      visitorPersona: {
        ...prev.visitorPersona,
        category: categoryId,
      },
      // Reset product selection when category changes
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
        // If we have a category_id in initialData, fetch products for that category
        await fetchProductsByCategory(initialData.category_id);
      } else if (initialData?.product_id) {
        // If we have a product_id but no category_id, find the category from the product
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

      if (initialData?.id) {
        // If initialData.id exists, it's an update
        await updateTest(initialData.id, formData);
      } else {
        // If no initialData.id, it's a creation
        await createTest(formData);
        // console.log("Creating test:", formData);
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
    <form onSubmit={handleSubmit} className="space-y-6 py-4 px-1">
      <div className="grid gap-4">
        {" "}
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
          <Label htmlFor="category">Category</Label>
          <Select
            value={formData.visitorPersona.category}
            onValueChange={handleCategoryChange}
            disabled={isLoading}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product">Select Product</Label>
          <Select
            value={formData.product_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, product_id: value }))
            }
            disabled={isLoading || !formData.visitorPersona.category}
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
            {" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="product_knowledge">Product Knowledge</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  How much they've heard about the product before today
                </p>
              </div>
              <Select
                value={formData.visitorPersona.product_knowledge}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("product_knowledge", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="product_knowledge">
                  <SelectValue placeholder="Select Product Knowledge" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="name-only">Name-only</SelectItem>
                  <SelectItem value="saw-ad">Saw ad/brochure</SelectItem>
                  <SelectItem value="peer-heard">Peer-heard</SelectItem>
                  <SelectItem value="very-familiar">Very familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="product_familiarity">Product Familiarity</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  How they've interacted with or experienced it
                </p>
              </div>
              <Select
                value={formData.visitorPersona.product_familiarity}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("product_familiarity", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="product_familiarity">
                  <SelectValue placeholder="Select Product Familiarity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never-seen">Never seen</SelectItem>
                  <SelectItem value="handled-briefly">
                    Handled briefly
                  </SelectItem>
                  <SelectItem value="tried-sample">Tried sample</SelectItem>
                  <SelectItem value="similar-user">Similar user</SelectItem>
                  <SelectItem value="loyal-user">Loyal user</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="technical_expertise">Technical Expertise</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  How comfortable they are with product-related details
                </p>
              </div>
              <Select
                value={formData.visitorPersona.technical_expertise}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("technical_expertise", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="technical_expertise">
                  <SelectValue placeholder="Select Technical Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="key_challenges">Key Challenges</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  Their primary concern or pain point
                </p>
              </div>
              <Select
                value={formData.visitorPersona.key_challenges}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("key_challenges", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="key_challenges">
                  <SelectValue placeholder="Select Key Challenges" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cost-control">Cost control</SelectItem>
                  <SelectItem value="quality">Quality/reliability</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="simplicity">Simplicity</SelectItem>
                  <SelectItem value="trust">Trust in vendor</SelectItem>
                  <SelectItem value="sustainability">Sustainability</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="buying_objective">Buying Objective</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  Their main "why" today
                </p>
              </div>
              <Select
                value={formData.visitorPersona.buying_objective}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("buying_objective", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="buying_objective">
                  <SelectValue placeholder="Select Buying Objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="save-money">Save money</SelectItem>
                  <SelectItem value="boost-quality">Boost quality</SelectItem>
                  <SelectItem value="meet-standards">Meet standards</SelectItem>
                  <SelectItem value="upgrade">Upgrade</SelectItem>
                  <SelectItem value="future-planning">
                    Future planning
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="budget_range">Budget Range</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  Their rough spend capacity
                </p>
              </div>
              <Select
                value={formData.visitorPersona.budget_range}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("budget_range", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="budget_range">
                  <SelectValue placeholder="Select Budget Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="very-low">Very low</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="mid">Mid</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="very-high">Very high</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="decision_authority">Decision Authority</Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  Their role in the purchase process
                </p>
              </div>
              <Select
                value={formData.visitorPersona.decision_authority}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("decision_authority", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="decision_authority">
                  <SelectValue placeholder="Select Decision Authority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="influencer">Influencer</SelectItem>
                  <SelectItem value="evaluator">Evaluator</SelectItem>
                  <SelectItem value="approver">Approver</SelectItem>
                  <SelectItem value="final-sign-off">Final sign-off</SelectItem>
                </SelectContent>
              </Select>
            </div>{" "}
            <div className="grid gap-1">
              <div>
                <Label htmlFor="exhibition_objective">
                  Exhibition Objective
                </Label>{" "}
                <p className="text-xs text-muted-foreground -mt-1">
                  What they want to achieve at your booth
                </p>
              </div>
              <Select
                value={formData.visitorPersona.exhibition_objective}
                onValueChange={(value) =>
                  handleVisitorPersonaChange("exhibition_objective", value)
                }
                disabled={isLoading}
              >
                <SelectTrigger id="exhibition_objective">
                  <SelectValue placeholder="Select Exhibition Objective" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info-gathering">Info gathering</SelectItem>
                  <SelectItem value="spec-comparison">
                    Spec comparison
                  </SelectItem>
                  <SelectItem value="pricing-talk">Pricing talk</SelectItem>
                  <SelectItem value="terms-warranty">Terms/warranty</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="demo-booking">Demo booking</SelectItem>
                </SelectContent>
              </Select>
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
