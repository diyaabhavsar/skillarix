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
  sessionError
}: SessionSetupFormProps) => {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Category Selection */}
      <div className="grid gap-2">
        <Label htmlFor="select-category" className="text-sm font-medium">
          Select Category
        </Label>
        <Select
          onValueChange={setSelectedCategoryId}
          value={selectedCategoryId}
          disabled={isSelectionLoading}
        >
          <SelectTrigger id="select-category">
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
      <div className="grid gap-2">
        <Label htmlFor="select-product" className="text-sm font-medium">
          Select Product
        </Label>
        <Select
          onValueChange={setSelectedProductId}
          value={selectedProductId}
          disabled={isSelectionLoading || products.length === 0 || !selectedCategoryId}
        >
          <SelectTrigger id="select-product">
            <SelectValue placeholder={
              selectedCategoryId 
                ? isSelectionLoading 
                  ? "Loading products..." 
                  : "Choose a product"
                : "Select a category first"
            } />
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
      <div className="grid gap-2">
        <Label htmlFor="select-test-config" className="text-sm font-medium">
          Select Test Scenario
        </Label>
        <Select
          onValueChange={setSelectedTestConfigId}
          value={selectedTestConfigId}
          disabled={isSelectionLoading || testConfigurations.length === 0 || !selectedProductId}
        >
          <SelectTrigger id="select-test-config">
            <SelectValue placeholder={
              selectedProductId
                ? isSelectionLoading
                  ? "Loading scenarios..."
                  : "Choose a scenario"
                : "Select a product first"
            } />
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

      <Button 
        onClick={onStartSession} 
        disabled={isStartButtonDisabled}
        className="w-full"
      >
        Create Session
      </Button>

      {sessionError && (
        <div className="text-red-500">{sessionError}</div>
      )}
    </div>
  );
};

export default SessionSetupForm;
