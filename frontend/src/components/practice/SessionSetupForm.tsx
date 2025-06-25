import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Product, Category, TestConfiguration } from "@/types/practice";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SessionSetupFormProps {
  categories: Category[];
  products: Product[];
  testConfigurations: TestConfiguration[];
  selectedCategoryId: string;
  selectedProductId: string;
  selectedTestConfigId: string;
  isSelectionLoading: boolean;
  setSelectedCategoryId: (id: string) => void;
  setSelectedProductId: (id: string) => void;
  setSelectedTestConfigId: (id: string) => void;
  onStartSession: () => void;
  isStartButtonDisabled: boolean;
  sessionError: string | null;
}

const SessionSetupForm = ({
  categories,
  products,
  testConfigurations,
  selectedCategoryId,
  selectedProductId,
  selectedTestConfigId,
  isSelectionLoading,
  setSelectedCategoryId,
  setSelectedProductId,
  setSelectedTestConfigId,
  onStartSession,
  isStartButtonDisabled,
  sessionError,
}: SessionSetupFormProps) => {
  // console.log({ selectedCategoryId, selectedProductId, selectedTestConfigId });
  return (
    <div className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Category Selection */}
        <div className="grid gap-3">
          <Label
            htmlFor="select-category"
            className="text-md font-semibold text-foreground"
          >
            Select Category
          </Label>
          <Select
            onValueChange={setSelectedCategoryId}
            value={selectedCategoryId}
            disabled={isSelectionLoading}
          >
            <SelectTrigger
              id="select-category"
              className="w-full rounded-lg px-4 py-3 border transition-colors duration-200 hover:border-primary/50 focus:border-primary"
            >
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product Selection */}
        <div className="grid gap-3">
          <Label
            htmlFor="select-product"
            className="text-md font-semibold text-foreground"
          >
            Select Product
          </Label>
          <Select
            onValueChange={setSelectedProductId}
            value={selectedProductId}
            disabled={
              isSelectionLoading || products.length === 0 || !selectedCategoryId
            }
          >
            <SelectTrigger
              id="select-product"
              className="w-full rounded-lg px-4 py-3 border transition-colors duration-200 hover:border-primary/50 focus:border-primary"
            >
              <SelectValue
                placeholder={
                  selectedCategoryId
                    ? isSelectionLoading
                      ? "Loading products..."
                      : "Choose a product"
                    : "Select a category first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {products.map((prod) => (
                <SelectItem key={prod.id} value={prod.id}>
                  {prod.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Test Configuration Selection */}
        <div className="grid gap-3">
          <Label
            htmlFor="select-test-config"
            className="text-md font-semibold text-foreground"
          >
            Select Test Configuration
          </Label>
          <Select
            onValueChange={setSelectedTestConfigId}
            value={selectedTestConfigId}
            disabled={
              isSelectionLoading ||
              testConfigurations.length === 0 ||
              !selectedProductId
            }
          >
            <SelectTrigger
              id="select-test-config"
              className="w-full rounded-lg px-4 py-3 border transition-colors duration-200 hover:border-primary/50 focus:border-primary"
            >
              <SelectValue
                placeholder={
                  selectedProductId
                    ? isSelectionLoading
                      ? "Loading scenarios..."
                      : "Choose a scenario"
                    : "Select a product first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {testConfigurations.map((config) => (
                <SelectItem key={config.id} value={config.id}>
                  {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-center mt-8">
          <Button
            onClick={() => {
              onStartSession();
            }}
            disabled={isStartButtonDisabled}
            className={cn(
              "w-full md:w-auto min-w-[200px]",
              "bg-[#6c47ff] hover:bg-[#5a3bd8] text-white",
              "px-8 py-3 rounded-xl",
              "transition-all duration-300 ease-in-out",
              "shadow-md hover:shadow-lg",
              "transform hover:scale-[1.02]",
              "font-semibold text-md",
              "disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-[#6c47ff]/50"
            )}
          >
            {isStartButtonDisabled ? (
              <span className="opacity-70">Next</span>
            ) : (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                Next
              </motion.span>
            )}
          </Button>
        </div>

        {sessionError && (
          <div className="text-red-500 text-center mt-4">{sessionError}</div>
        )}
      </div>
    </div>
  );
};

export default SessionSetupForm;
