import React, { useEffect, useState } from "react";
import { TestSetupHeader } from "@/components/products/SetupHeader";
import { useTests } from "@/hooks/useTests";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Plus,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

import TestConfigurationForm from "@/components/testconfig/TestConfigurationForm";
import TestConfigurationTable from "@/components/testconfig/TestConfigurationTable";

const TestSetup = () => {
  const { tests, deleteTest, fetchTests } = useTests();
  const { products, fetchAllProducts } = useProducts();

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

        <TestConfigurationTable
          tests={tests}
          deleteTest={deleteTest}
          fetchTests={fetchTests}
          products={products}
          fetchAllProducts={fetchAllProducts}
          testToDelete={testToDelete}
          setTestToDelete={setTestToDelete}
          handleDelete={handleDelete}
          formatDate={formatDate}
          formatValue={formatValue}
          getProductName={getProductName}
        />
      </main>
    </div>
  );
};

export default TestSetup;