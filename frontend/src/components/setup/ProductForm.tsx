import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import FileUploadSection from "./FileUploadSection";
import ProductInfoForm from "./ProductInfoForm";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { api } from "@/utils/api";

interface ProductFormProps {
  onSuccess?: () => void;
  initialData?: {
    productId?: string;
    productName: string;
    description: string;
    categoryId: string;
  };
}

const ProductForm = ({ onSuccess, initialData }: ProductFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [productInfo, setProductInfo] = useState({
    productName: initialData?.productName || "",
    description: initialData?.description || "",
  });

  const {
    categories,
    isLoading,
    setIsLoading,
    createProduct,
    updateProduct,
    setSelectedCategoryId,
    selectedCategoryId,
    setCategories,
  } = useProducts();

  // Set initial category ID when editing
  useEffect(() => {
    if (initialData?.categoryId) {
      setSelectedCategoryId(initialData.categoryId);
    }
  }, [initialData?.categoryId]);

  const handleFileChange = (uploadedFile: File | null) => {
    setFile(uploadedFile);
  };

  const handleProductInfoChange = (
    field: "productName" | "description",
    value: string
  ) => {
    setProductInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/categories", { name: newCategoryName });
      const newCat = response;
      const addedCat = { id: newCat._id, name: newCat.name };
      // First update the categories list
      const updatedCategories = [...categories, addedCat];
      setCategories(updatedCategories);
      // Then set the selected category ID to ensure the new category is selected
      setSelectedCategoryId(addedCat.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      toast.success(
        `Category "${newCategoryName}" created successfully and selected.`
      );
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error(`Failed to create category: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSubmit = async () => {
    if (!productInfo.productName.trim() || !selectedCategoryId) {
      if (!productInfo.productName.trim())
        toast.error("Please enter a product name.");
      if (!selectedCategoryId)
        toast.error("Please select or create a category.");
      return;
    }

    // Only require file for new products
    if (!initialData && !file) {
      toast.error("Please upload a product file.");
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("name", productInfo.productName);
    formDataPayload.append("category_id", selectedCategoryId);
    if (productInfo.description.trim()) {
      formDataPayload.append("description", productInfo.description);
    }
    if (file) {
      formDataPayload.append("file", file);
    }

    setIsLoading(true);
    try {
      if (initialData) {
        // For update, we need the product ID
        const productId = initialData.productId;
        await updateProduct(productId, formDataPayload);
      } else {
        await createProduct(formDataPayload);
        // Reset form only for create operation
        setFile(null);
        setProductInfo({ productName: "", description: "" });
        setSelectedCategoryId("");
      }
      onSuccess?.();
      // Close the sheet by simulating escape key
      const event = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
      });
      document.dispatchEvent(event);
    } catch (err: any) {
      toast.error(
        `${initialData ? "Update" : "Upload"} failed: ${err.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isEditMode = !!initialData;

  return (
    <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
      <SheetHeader>
        <SheetTitle>
          {isEditMode ? "Edit Product" : "Add New Product"}
        </SheetTitle>
        <SheetDescription>
          {isEditMode
            ? "Make changes to your product here."
            : "Upload a new product and fill in the details below."}
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 py-4">
        {!isEditMode && (
          <FileUploadSection
            file={file}
            onFileChange={handleFileChange}
            isLoading={isLoading}
          />
        )}
        <ProductInfoForm
          productInfo={productInfo}
          onProductInfoChange={handleProductInfoChange}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          isCreatingCategory={isCreatingCategory}
          setIsCreatingCategory={setIsCreatingCategory}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleCreateCategory={handleCreateCategory}
          isLoading={isLoading}
        />

        <SheetFooter>
          {" "}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading
              ? "Processing..."
              : isEditMode
              ? "Save Changes"
              : "Save Product"}
          </Button>
        </SheetFooter>
      </div>
    </SheetContent>
  );
};

export default ProductForm;
