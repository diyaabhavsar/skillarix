import React, { useState } from "react";
import ProductSetupBreadcrumb from "@/components/products/ProductSetupBreadcrumb";
import { SetupHeader } from "@/components/products/SetupHeader";
import { useProducts } from "@/hooks/useProducts";
import ShadcnTable, { ShadcnColumn } from "@/components/ui/shadcn-table";
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

const Products = () => {
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { products, categories, deleteProduct, fetchProducts } = useProducts();

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct(productToDelete);
      toast.success("Product deleted successfully");
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
                fetchProducts();
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
      render: (value) => {
        const category = categories.find((cat) => cat.id === value);
        return category ? category.name : "Unknown";
      },
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
        <SetupHeader onProductAdded={fetchProducts} />

        <div className="rounded-md border bg-white">
          <ShadcnTable
            columns={columns}
            data={products}
            emptyMessage="No products available."
            className="rounded-md border overflow-x-auto bg-muted/5 shadow-sm hover:shadow-md"
          />
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
