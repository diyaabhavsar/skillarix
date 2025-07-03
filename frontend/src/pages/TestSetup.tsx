import { useEffect, useState } from "react";
import { TestSetupHeader } from "@/components/products/SetupHeader";
import { useTests } from "@/hooks/useTests";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

import TestConfigurationForm from "@/components/testconfig/TestConfigurationForm";
import TestConfigurationTable from "@/components/testconfig/TestConfigurationTable";

const TestSetup = () => {
  const { tests, testsResponse, deleteTest, fetchTests, isLoading } = useTests();
  const { products, fetchAllProducts } = useProducts();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    skip: 0,
    limit: 10,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });
  const [testToDelete, setTestToDelete] = useState<string | null>(null);

  // Function to handle page changes
  const handlePageChange = async (page: number) => {
    try {
      setCurrentPage(page);
      await fetchTests(page);
    } catch (error) {
      console.error("Failed to fetch page:", page, error);
      toast.error("Failed to load page " + page);
    }
  };

  // Update pagination data when tests response changes
  useEffect(() => {
    if (testsResponse) {
      setPaginationData({
        skip: ((testsResponse.page - 1) * testsResponse.limit) || 0,
        limit: testsResponse.limit || 10,
        count: testsResponse.count || 0,
        total_count: testsResponse.total_count || 0,
        total_pages: testsResponse.total_pages || 1,
      });
    } else if (tests.length > 0) {
      // Fallback when no pagination response (backward compatibility)
      setPaginationData({
        skip: 0,
        limit: tests.length,
        count: tests.length,
        total_count: tests.length,
        total_pages: 1,
      });
    }
  }, [testsResponse, tests]);

  // Fetch data when component mounts
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchTests(currentPage),
        fetchAllProducts()
      ]);
    };
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async () => {
    if (!testToDelete) return;

    try {
      await deleteTest(testToDelete);
      toast.success("Test configuration deleted successfully");
      
      // If this was the last item on the current page and not on page 1, go to previous page
      if (tests.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        await fetchTests(newPage);
      } else {
        // Otherwise refresh current page
        await fetchTests(currentPage);
      }
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
                    fetchTests(currentPage);
                    toast.success("Test configuration created successfully");
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="my-8">
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <TestConfigurationTable
              tests={tests}
              fetchTests={async () => await fetchTests(currentPage)}
              setTestToDelete={setTestToDelete}
              handleDelete={handleDelete}
              formatDate={formatDate}
              formatValue={formatValue}
              getProductName={getProductName}
              currentPage={currentPage}
              paginationData={paginationData}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TestSetup;
