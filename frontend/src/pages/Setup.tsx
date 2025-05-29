import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductSetupBreadcrumb from "@/components/setup/ProductSetupBreadcrumb";
import { SetupHeader } from "@/components/setup/SetupHeader";
import FileUploadSection from "@/components/setup/FileUploadSection";
import ProductInfoForm from "@/components/setup/ProductInfoForm";
import FormActionButtons from "@/components/setup/FormActionButtons";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Setup = () => {
  // State for file upload
  const [file, setFile] = useState<File | null>(null);

  // State for categories and selected category
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // State for product info
  const [productInfo, setProductInfo] = useState({
    productName: "",
    description: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const { token } = useAuth();

  // --- Fetch Categories on Mount ---
  useEffect(() => {
    const fetchCategories = async () => {
      if (!token) return;
      try {
        const res = await fetch("http://localhost:8000/categories", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.detail || "Failed to fetch categories");
        }
        const data = await res.json();
        setCategories(data.map((cat: any) => ({ id: cat._id, name: cat.name })));
         if (data.length > 0) {
            setSelectedCategoryId(data[0]._id);
         }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error(`Failed to load categories: ${error.message}`);
      }
    };
     if (token && categories.length === 0) {
       fetchCategories();
     }
  }, [token, categories.length]);

  // --- Handlers ---

  const handleFileChange = (uploadedFile: File | null) => {
     setFile(uploadedFile);
  };

  const handleProductInfoChange = (field: "productName" | "description", value: string) => {
    setProductInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateCategory = async () => {
    console.log("Attempting to create category:", newCategoryName); // <-- Add a console log
    if (!newCategoryName.trim() || !token) {
       console.log("Validation failed:", newCategoryName, token); // <-- Add a console log
       toast.error("Please enter a category name."); // This toast is triggered
       return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:8000/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCategoryName })
      });
       if (!res.ok) {
           const err = await res.json();
           throw new Error(err.detail || "Failed to create category");
        }
      const newCat = await res.json();
      const addedCat = { id: newCat.id, name: newCat.name };
      setCategories([...categories, addedCat]);
      setSelectedCategoryId(addedCat.id);
      setNewCategoryName('');
      setIsCreatingCategory(false);
      toast.success(`Category "${newCategoryName}" created.`);
    } catch (error: any) { // Use any for now, or define a proper error type
      console.error("Error creating category:", error);
      toast.error(`Failed to create category: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Submit handler (Upload Product) ---
  const handleProcess = async () => {
    if (!file) {
      toast.error("Please upload a product file.");
      return;
    }
    if (!productInfo.productName.trim()) {
       toast.error("Please enter a product name.");
       return;
    }
    if (!selectedCategoryId) {
        toast.error("Please select or create a category.");
        return;
    }
     if (!token) {
        toast.error("Not authenticated. Please log in.");
        return;
     }

    setIsLoading(true);
    const formDataPayload = new FormData();
    formDataPayload.append("name", productInfo.productName);
    formDataPayload.append("category_id", selectedCategoryId);
    if (productInfo.description.trim()) {
        formDataPayload.append("description", productInfo.description);
    }
    formDataPayload.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/products", {
        method: "POST",
        headers: {
           Authorization: `Bearer ${token}`
        },
        body: formDataPayload,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to upload product");
      }

      const result = await response.json();
      toast.success("Product uploaded successfully!");
      console.log("Uploaded Product Details:", result);
       setFile(null);
       setProductInfo({ productName: "", description: "" });
       setSelectedCategoryId('');

    } catch (err: any) { // Use any for now, or define a proper error type
      console.error("Upload failed:", err);
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProductSetupBreadcrumb />
        <SetupHeader />
        <div className="grid gap-6">
          <FileUploadSection file={file} onFileChange={handleFileChange} isLoading={isLoading} />
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
          <FormActionButtons onProcess={handleProcess} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default Setup;
