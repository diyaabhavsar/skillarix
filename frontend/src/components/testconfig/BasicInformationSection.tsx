import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { capitalizeWords } from "@/utils/textFormatting";

interface BasicInformationProps {
  name: string;
  categoryId: string;
  productId: string;
  categories: Array<{ id: string; name: string }>;
  products: Array<{ _id: string; name: string }>;
  onNameChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onProductChange: (value: string) => void;
  isLoading: boolean;
}

export const BasicInformationSection: React.FC<BasicInformationProps> = ({
  name,
  categoryId,
  productId,
  categories,
  products,
  onNameChange,
  onCategoryChange,
  onProductChange,
  isLoading,
}) => {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Test Name</Label>
        <Input
          id="name"
          placeholder="Enter test name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={categoryId}
          onValueChange={onCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="product">Select Product</Label>
        <Select
          value={productId}
          onValueChange={onProductChange}
          disabled={isLoading || !categoryId}
        >
          <SelectTrigger id="product">
            <SelectValue placeholder="Select a product" />
          </SelectTrigger>
          <SelectContent>
            {products.map((product) => (
              <SelectItem key={product._id} value={product._id}>
                {product.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
