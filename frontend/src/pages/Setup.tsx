import React, { useState } from "react";
import ProductSetupBreadcrumb from "@/components/setup/ProductSetupBreadcrumb";
import { SetupHeader } from "@/components/setup/SetupHeader";
import { useProducts } from "@/hooks/useProducts";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Eye, FileIcon, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProductForm from "@/components/setup/ProductForm";
import ProductDetails from "@/components/setup/ProductDetails";

const Setup = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [productInfo, setProductInfo] = useState({
    productName: "",
    description: "",
  });
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const {
    products,
    categories,
    isLoading,
    setIsLoading,
    createProduct,
    deleteProduct,
    viewProductContent,
    setSelectedCategoryId,
    selectedCategoryId,
    setCategories,
    fetchProducts,
  } = useProducts();

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
      const res = await fetch("http://localhost:8000/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newCategoryName }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create category");
      }
      const newCat = await res.json();
      const addedCat = { id: newCat._id, name: newCat.name };
      setCategories([...categories, addedCat]);
      setSelectedCategoryId(addedCat.id);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      toast.success(`Category "${newCategoryName}" created.`);
    } catch (error: any) {
      console.error("Error creating category:", error);
      toast.error(`Failed to create category: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!file || !productInfo.productName.trim() || !selectedCategoryId) {
      if (!file) toast.error("Please upload a product file.");
      if (!productInfo.productName.trim())
        toast.error("Please enter a product name.");
      if (!selectedCategoryId)
        toast.error("Please select or create a category.");
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append("name", productInfo.productName);
    formDataPayload.append("category_id", selectedCategoryId);
    if (productInfo.description.trim()) {
      formDataPayload.append("description", productInfo.description);
    }
    formDataPayload.append("file", file);

    try {
      await createProduct(formDataPayload);
      await fetchProducts();
      toast.success("Product uploaded successfully!");
      setFile(null);
      setProductInfo({ productName: "", description: "" });
      setSelectedCategoryId("");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete);
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setProductToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <ProductSetupBreadcrumb />
        <SetupHeader onProductAdded={fetchProducts} />

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {categories.find((cat) => cat.id === product.category_id)
                      ?.name || "Unknown"}
                  </TableCell>
                  <TableCell>{product.description || "-"}</TableCell>
                  <TableCell>{formatDate(product.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <ProductDetails
                          data={{
                            name: product.name,
                            description: product.description || "",
                            categoryId: product.category_id,
                            categoryName:
                              categories.find(
                                (cat) => cat.id === product.category_id
                              )?.name || "Unknown",
                            createdAt: product.created_at,
                          }}
                        />
                      </Sheet>

                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Product"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <ProductForm
                          onSuccess={() => {
                            fetchProducts();
                            toast.success("Product updated successfully");
                          }}
                          initialData={{
                            productId: product._id,
                            productName: product.name,
                            description: product.description || "",
                            categoryId: product.category_id,
                          }}
                        />
                      </Sheet>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setProductToDelete(product._id)}
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <AlertDialog
          open={!!productToDelete}
          onOpenChange={() => setProductToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                product and all its related test configurations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Setup;
