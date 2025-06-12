import React, { useEffect, useState } from "react";
import { TestSetupHeader } from "@/components/setup/SetupHeader";
import { useTests, type Test } from "@/hooks/useTests";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  MoreHorizontal,
  UserCircle,
  User2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import TestConfigurationForm from "@/components/setup/TestConfigurationForm";
import TestConfigurationDetails from "@/components/setup/TestConfigurationDetails";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const TestSetup = () => {
  const {
    tests,
    isLoading: testsLoading,
    createTest,
    updateTest,
    deleteTest,
    fetchTests,
  } = useTests();
  const {
    products,
    fetchAllProducts,
    isLoading: productsLoading,
  } = useProducts();

  // Fetch data when component mounts
  useEffect(() => {
    fetchTests();
    fetchAllProducts();
  }, []);

  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!testToDelete) return;

    try {
      await deleteTest(testToDelete);
      toast.success("Test configuration deleted successfully");
      setTestToDelete(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete test configuration");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const formatValue = (value: string): string => {
    if (!value) return "-";
    // First replace underscores with spaces, then handle hyphens
    return value
      .split(/[-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Helper function to get product name
  const getProductName = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    return product?.name || "Unknown Product";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <TestSetupHeader />
          <Sheet>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Test
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:max-w-2xl overflow-y-auto"
            >
              <SheetHeader className="px-1">
                <SheetTitle>Create New Test Configuration</SheetTitle>
                <SheetDescription>
                  Configure a new test by filling out the form below.
                </SheetDescription>
              </SheetHeader>
              <div className="overflow-y-auto px-1">
                <TestConfigurationForm
                  onSuccess={() => {
                    fetchTests();
                    toast.success("Test configuration created successfully");
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {" "}
              <TableRow>
                <TableHead className="font-medium">Name</TableHead>
                <TableHead className="font-medium">Product</TableHead>
                <TableHead className="font-medium">Created At</TableHead>
                <TableHead className="font-medium">Visitor Persona</TableHead>
                <TableHead className="font-medium text-right w-[80px]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test._id} className="hover:bg-gray-50">
                  <TableCell className="py-3">{test.name}</TableCell>
                  <TableCell className="py-3">
                    {getProductName(test.product_id)}
                  </TableCell>
                  <TableCell className="py-3">
                    {formatDate(test.created_at)}
                  </TableCell>
                  <TableCell className="py-3">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2"
                        >
                          <UserCircle className="h-4 w-4" />
                          <span>Persona</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Visitor Persona Details</DialogTitle>
                          <DialogDescription>
                            Detailed information about the visitor persona for
                            this test.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {Object.entries(test.visitorPersona).map(
                            ([key, value]) =>
                              key !== "category" && (
                                <div
                                  key={key}
                                  className="grid grid-cols-2 items-center gap-4"
                                >
                                  <div className="font-medium">
                                    {formatValue(key)}
                                  </div>
                                  <div>{formatValue(value as string)}</div>
                                </div>
                              )
                          )}
                        </div>{" "}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
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
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                            </SheetTrigger>
                            <TestConfigurationDetails
                              test={test}
                              formatDate={formatDate}
                              formatValue={formatValue}
                              getProductName={getProductName}
                            />
                          </Sheet>
                          <Sheet>
                            <SheetTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </SheetTrigger>
                            <SheetContent
                              side="right"
                              className="w-full sm:max-w-3xl overflow-y-auto"
                            >
                              <SheetHeader className="px-1">
                                <SheetTitle>Edit Test Configuration</SheetTitle>
                              </SheetHeader>
                              <div className="overflow-y-auto px-1">
                                <TestConfigurationForm
                                  initialData={{
                                    id: test._id,
                                    name: test.name,
                                    category_id: test.category_id,
                                    product_id: test.product_id,
                                    visitorPersona: test.visitorPersona,
                                    additionalCriteria: test.additionalCriteria,
                                  }}
                                  onSuccess={() => {
                                    fetchTests();
                                    toast.success(
                                      "Test configuration updated successfully"
                                    );
                                  }}
                                />
                              </div>
                            </SheetContent>
                          </Sheet>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                onClick={() => setTestToDelete(test._id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Test Configuration
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this test
                                  configuration? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel
                                  onClick={() => setTestToDelete(null)}
                                >
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
};

export default TestSetup;
