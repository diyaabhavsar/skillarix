import React, { useState } from "react";
import ProductSetupBreadcrumb from "@/components/products/ProductSetupBreadcrumb";
import { SetupHeader } from "@/components/products/SetupHeader";
import { useProducts } from "@/hooks/useProducts";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Eye, MoreHorizontal, Pencil, Trash2, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
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
import ProductForm from "@/components/products/ProductForm";
import ProductDetails from "@/components/products/ProductDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { env } from "@/config/env";

const Products = () => {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { products, categories, deleteProduct, fetchProducts } = useProducts();

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

  const isTextOverflowing = (text: string) => {
    // We can use a rough estimation: if text is longer than ~45 characters it will likely overflow
    // This is an approximation based on the container width and typical character width
    return text.length > 45;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <SetupHeader onProductAdded={fetchProducts} />

        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                {" "}
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[200px]">Category</TableHead>
                <TableHead className="max-w-[360px]">Description</TableHead>
                <TableHead className="max-w-[360px]">File</TableHead>
                <TableHead className="w-[150px]">Created At</TableHead>
                <TableHead className="w-[150px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product._id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {categories.find((cat) => cat.id === product.category_id)
                      ?.name || "Unknown"}
                  </TableCell>{" "}
                  <TableCell>
                    {product.description ? (
                      <div className="relative max-w-[360px]">
                        {isTextOverflowing(product.description) ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="block truncate cursor-default">
                                  {product.description}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                align="start"
                                className="max-w-[360px] bg-white text-black border shadow-lg p-3 text-sm"
                              >
                                {product.description}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="block cursor-default">
                            {product.description}
                          </span>
                        )}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {product.file_url ? (
                      <a
                        href={product.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-800 hover:underline flex items-center"
                        download={product.file_name}
                        title={product.file_name}
                      >
                        <FileDown />
                      </a>
                    ) : (
                      <span className="text-blue-400" title="No file attached">
                        <FileDown />
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(product.created_at)}</TableCell>{" "}
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Sheet>
                          <SheetTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
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
                              fileUrl: product.file_url,
                              fileName: product.file_name,
                              createdAt: product.created_at,
                            }}
                          />
                        </Sheet>

                        <Sheet>
                          <SheetTrigger asChild>
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
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

                        <DropdownMenuItem
                          onClick={() => setProductToDelete(product._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default Products;
