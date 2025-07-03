import React, { useState, useEffect } from "react";
import ProductSetupBreadcrumb from "@/components/products/ProductSetupBreadcrumb";
import { SetupHeader } from "@/components/products/SetupHeader";
import { useProducts as useProductsOnly } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import ShadcnTable, { ShadcnColumn } from "@/components/ui/shadcnTable/shadcn-table";
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
import { formatDateToIndianDateOnly } from "@/utils/dateUtils";

interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

const Products = () => {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    skip: 0,
    limit: 10,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });
  const { products, deleteProduct, fetchProducts, productsResponse, isLoading } = useProductsOnly();
  const { categories, fetchAllCategories, getCategoryName } = useCategories();

  // Function to handle page changes
  const handlePageChange = async (page: number) => {
    try {
      setCurrentPage(page);
      await fetchProducts(page);
    } catch (error) {
      console.error("Failed to fetch page:", page, error);
      toast.error("Failed to load page " + page);
    }
  };

  // Update pagination data when products response changes
  useEffect(() => {
    if (productsResponse) {
      setPaginationData({
        skip: ((productsResponse.page - 1) * productsResponse.limit) || 0,
        limit: productsResponse.limit || 10,
        count: productsResponse.count || 0,
        total_count: productsResponse.total_count || 0,
        total_pages: productsResponse.total_pages || 1,
      });
    }
  }, [productsResponse]);

  // Load initial products and categories
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchProducts(currentPage),
        fetchAllCategories()
      ]);
    };
    loadData();
  }, []);

  // Ensure categories are loaded if they're empty
  useEffect(() => {
    if (categories.length === 0) {
      fetchAllCategories();
    }
  }, [categories.length]);

// Debug logs - remove in production
console.log({products, categories})
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete);
      toast.success("Product deleted successfully");
      
      // If this was the last item on the current page and not on page 1, go to previous page
      if (products.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        await fetchProducts(newPage);
      } else {
        // Otherwise refresh current page
        await fetchProducts(currentPage);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setProductToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateToIndianDateOnly(dateString);
  };

  // Actions dropdown component to handle local state for each row
  const ProductActionsDropdown = ({ row }: { row: any }) => {
    const [open, setOpen] = React.useState(false);
    const [sheetType, setSheetType] = React.useState<null | 'view' | 'edit'>(null);
    const closeMenu = () => setOpen(false);
    const closeSheet = () => setSheetType(null);
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <Sheet open={sheetType === 'view'} onOpenChange={(val) => { if (!val) { closeSheet(); closeMenu(); } }}>
            <SheetTrigger asChild>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSheetType('view'); }}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
            </SheetTrigger>
            <ProductDetails
              data={{
                name: row.name,
                description: row.description || "",
                categoryId: row.category_id,
                categoryName:
                  categories.find((cat) => cat.id === row.category_id)
                    ?.name || "Unknown",
                fileUrl: row.file_url,
                fileName: row.file_name,
                createdAt: row.created_at,
              }}
            />
          </Sheet>
          <Sheet open={sheetType === 'edit'} onOpenChange={(val) => { if (!val) { closeSheet(); closeMenu(); } }}>
            <SheetTrigger asChild>
              <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setSheetType('edit'); }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </SheetTrigger>
            <ProductForm
              onSuccess={() => {
                fetchProducts(currentPage);
                console.log("done")
                toast.success("Product updated successfully");
              }}
              initialData={{
                productId: row._id,
                productName: row.name,
                description: row.description || "",
                categoryId: row.category_id,
                filename: row.file_name || "",
                fileUrl: row.file_url || "",
              }}
            />
          </Sheet>
          <DropdownMenuItem onClick={() => { setProductToDelete(row._id); closeMenu(); }}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const columns: ShadcnColumn<any>[] = [
    {
      key: "name",
      header: "Name",
      className: "py-3 font-medium text-slate-700",
    },
    {
      key: "category_id",
      header: "Category",
      className: "py-3 text-slate-700",
      render: (value) => getCategoryName(value),
    },
    {
      key: "description",
      header: "Description",
      className: "py-3 text-slate-700",
      render: (value) => (
        <div className="relative max-w-[360px]">
          {value && value.length > 45 ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block truncate cursor-default">{value}</span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  className="max-w-[360px] bg-white text-black border shadow-lg p-3 text-sm"
                >
                  {value}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="block cursor-default">{value || "-"}</span>
          )}
        </div>
      ),
    },
    {
      key: "file_url",
      header: "File",
      className: "py-3 text-slate-700",
      render: (value, row) =>
        value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-800 hover:underline flex items-center"
            title={row.file_name}
          >
            <FileDown />
          </a>
        ) : (
          <span className="text-blue-400" title="No file attached">
            <FileDown />
          </span>
        ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "py-3 text-slate-700",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      className: "py-3 text-center text-slate-700",
      render: (_, row) => <ProductActionsDropdown row={row} />,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <SetupHeader onProductAdded={() => { fetchProducts(currentPage); }} />

        <div className="my-8">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <div className="rounded-md border bg-white">
              <ShadcnTable
                columns={columns}
                data={products}
                currentPage={currentPage}
                paginationData={paginationData}
                onPageChange={handlePageChange}
                emptyMessage="No products available."
                className="rounded-md border overflow-x-auto bg-muted/5 shadow-sm hover:shadow-md"
              />
            </div>
          </div>
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
