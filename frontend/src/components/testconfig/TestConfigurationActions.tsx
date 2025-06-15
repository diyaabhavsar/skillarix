import React from "react";
import { Test } from "@/types/testconfig";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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
import { Pencil, Trash2, Eye, MoreHorizontal } from "lucide-react";
import TestConfigurationForm from "./TestConfigurationForm";
import TestConfigurationDetails from "./TestConfigurationDetails";

interface TestConfigurationActionsProps {
  test: Test;
  fetchTests: () => Promise<void>;
  setTestToDelete: React.Dispatch<React.SetStateAction<string | null>>;
  handleDelete: () => Promise<void>;
  formatDate: (dateString: string) => string;
  formatValue: (value: string) => string;
  getProductName: (productId: string) => string;
}

const TestConfigurationActions: React.FC<TestConfigurationActionsProps> = ({
  test,
  fetchTests,
  setTestToDelete,
  handleDelete,
  formatDate,
  formatValue,
  getProductName,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <Sheet>
          <SheetTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
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
                  toast.success("Test configuration updated successfully");
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
                Are you sure you want to delete this test configuration? This
                action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setTestToDelete(null)}>
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
  );
};

export default TestConfigurationActions;