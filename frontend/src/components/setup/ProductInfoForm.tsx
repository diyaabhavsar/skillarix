import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export interface ProductInfoFormProps {
  productInfo: { productName: string; description: string; };
  onProductInfoChange: (field: "productName" | "description", value: string) => void;
  categories: { id: string; name: string; }[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  isCreatingCategory: boolean;
  setIsCreatingCategory: (isCreating: boolean) => void;
  newCategoryName: string;
  setNewCategoryName: (name: string) => void;
  handleCreateCategory: () => Promise<void>;
  isLoading: boolean;
}

const ProductInfoForm = ({
  productInfo,
  onProductInfoChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  isCreatingCategory,
  setIsCreatingCategory,
  newCategoryName,
  setNewCategoryName,
  handleCreateCategory,
  isLoading,
}: ProductInfoFormProps) => {
  return (
    <div className="grid gap-4">
      <div className="text-lg font-medium">Product Information</div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="product-name" className="text-sm font-medium">
            Product Name
          </Label>
          <Input
            id="product-name"
            placeholder="Enter product name"
            value={productInfo.productName}
            onChange={e => onProductInfoChange("productName", e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-category" className="text-sm font-medium">
            Category
          </Label>
          {isCreatingCategory ? (
            <div className="flex gap-2">
              <Input
                placeholder="New Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                disabled={isLoading}
              />
              <Button type="button" onClick={handleCreateCategory} disabled={isLoading}>Create</Button>
              <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(false)} disabled={isLoading}>Cancel</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select onValueChange={onCategoryChange} value={selectedCategoryId} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" onClick={() => setIsCreatingCategory(true)} disabled={isLoading}>
                New
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="product-description" className="text-sm font-medium">
          Description
        </Label>
        <Textarea
          id="product-description"
          placeholder="Enter product description"
          value={productInfo.description}
          onChange={e => onProductInfoChange("description", e.target.value)}
          disabled={isLoading}
          rows={4}
        />
      </div>
    </div>
  );
};

export default ProductInfoForm;
