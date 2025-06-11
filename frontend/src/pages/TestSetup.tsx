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
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
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

const TestSetup = () => {
  const {
    tests,
    isLoading: testsLoading,
    createTest,
    updateTest,
    deleteTest,
    fetchTests,
  } = useTests();
  const { products, fetchProducts, isLoading: productsLoading } = useProducts(); // Add products from useProducts hook

  // Fetch data when component mounts
  useEffect(() => {
    fetchTests();
    fetchProducts();
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

  const renderPersonaDetails = (test: Test) => {
    const persona = test.visitorPersona;
    return (
      <div className="space-y-1 text-sm max-w-md">
        <div className="line-clamp-2">
          <span className="font-medium">Background:</span> {persona.background}
        </div>
        <div className="line-clamp-2">
          <span className="font-medium">Goals:</span> {persona.goals}
        </div>
      </div>
    );
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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Name</TableHead>
                <TableHead className="w-[200px]">Product</TableHead>
                <TableHead>Visitor Persona</TableHead>
                <TableHead className="w-[150px]">Created At</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tests.map((test) => (
                <TableRow key={test._id}>
                  <TableCell className="font-medium">{test.name}</TableCell>
                  <TableCell>{getProductName(test.product_id)}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm max-w-md">
                      <div className="line-clamp-2">
                        <span className="font-medium">Background:</span>{" "}
                        {test.visitorPersona.background}
                      </div>
                      <div className="line-clamp-2">
                        <span className="font-medium">Goals:</span>{" "}
                        {test.visitorPersona.goals}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(test.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Test Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <TestConfigurationDetails
                          test={test}
                          formatDate={formatDate}
                        />
                      </Sheet>
                      <Sheet>
                        <SheetTrigger asChild>
                          <Button variant="ghost" size="icon" title="Edit Test">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </SheetTrigger>
                        <SheetContent
                          side="right"
                          className="w-full sm:max-w-3xl overflow-y-auto"
                        >
                          <SheetHeader className="px-1">
                            <SheetTitle>Edit Test Configuration</SheetTitle>
                          </SheetHeader>{" "}
                          <div className="overflow-y-auto px-1">
                            <TestConfigurationForm
                              initialData={{
                                id: test._id,
                                name: test.name,
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
                      </Sheet>{" "}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTestToDelete(test._id)}
                            title="Delete Test"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
