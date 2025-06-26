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
import { capitalizeWords } from "@/utils/textFormatting";
import { env } from "@/config/env";

interface ProductFormProps {
  onSuccess?: () => void;
  initialData?: {
    productId?: string;
    productName: string;
    description: string;
    categoryId: string;
    filename?: string;
    fileUrl?: string;
  };
}

const ProductForm = ({ onSuccess, initialData }: ProductFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadFile, setUploadFile] = useState({
    filename: "",
    url: "",
  });
  const [productInfo, setProductInfo] = useState({
    productName: initialData?.productName || "",
    description: initialData?.description || "",
    filename: initialData?.filename || "",
    fileUrl: initialData?.fileUrl || "",
  });

  const {
    categories,
    isLoading,
    setIsLoading,
    createProduct,
    updateProduct,
    setSelectedCategoryId,
    selectedCategoryId,
  } = useProducts();

  useEffect(() => {
    if (initialData?.categoryId) {
      setSelectedCategoryId(initialData.categoryId);
    }
  }, [initialData?.categoryId]);

  const handleFileChange = async (uploadedFile: File | null) => {
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

  const handleSubmit = async () => {
    if (!productInfo.productName.trim() || !selectedCategoryId) {
      if (!productInfo.productName.trim())
        toast.error("Please enter a product name.");
      if (!selectedCategoryId)
        toast.error("Please select or create a category.");
      return;
    }

    if (!initialData && !file) {
      toast.error("Please upload a product file.");
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("name", capitalizeWords(productInfo.productName));
    formDataPayload.append("category_id", selectedCategoryId);

    if (productInfo.description.trim()) {
      formDataPayload.append("description", productInfo.description);
    }

    if (file) {
      formDataPayload.append("file", file);
      const uploadFile = await api.upload(
        "/file-upload/upload-file",
        file,
        "products"
      );
      setUploadFile(uploadFile);

      // Trim base URL to store only relative path
      const baseUrl =
        env.FILE_URL_ENDPOINT ||
        "http://localhost:8070" ||
        "https://skillarix.getondataconsulting.in";

      const relativeUrl = uploadFile.url.replace(baseUrl, "");

      formDataPayload.append(
        "filename",
        uploadFile.filename || productInfo.filename
      );
      formDataPayload.append("file_url", relativeUrl || productInfo.fileUrl);

      console.log("Trimmed File URL:", relativeUrl);
    }

    setIsLoading(true);
    try {
      if (initialData) {
        const productId = initialData.productId!;
        await updateProduct(productId, formDataPayload);
      } else {
        await createProduct(formDataPayload);
        setFile(null);
        setProductInfo({
          productName: "",
          description: "",
          filename: "",
          fileUrl: "",
        });
        setSelectedCategoryId("");
      }

      onSuccess?.();

      // Close the sheet
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
            fileUrl={uploadFile.url}
          />
        )}
        <ProductInfoForm
          productInfo={productInfo}
          onProductInfoChange={handleProductInfoChange}
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onCategoryChange={setSelectedCategoryId}
          isLoading={isLoading}
          isEditingMode={isEditMode}
          onFileChange={handleFileChange}
        />

        <SheetFooter>
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
