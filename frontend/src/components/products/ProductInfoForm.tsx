import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Paperclip, FileDown, X } from "lucide-react";

export interface ProductInfoFormProps {
  productInfo: {
    productName: string;
    description: string;
    filename: string;
    fileUrl: string;
  };
  onProductInfoChange: (
    field: "productName" | "description",
    value: string
  ) => void;
  categories: { id: string; name: string }[];
  selectedCategoryId: string;
  onCategoryChange: (categoryId: string) => void;
  isLoading: boolean;
  onFileChange?: (file: File | null) => void; // <-- Add this prop
  isEditingMode?: boolean; // Optional prop to indicate if the form is in edit mode
}

const ProductInfoForm = ({
  productInfo,
  onProductInfoChange,
  categories,
  selectedCategoryId,
  onCategoryChange,
  isLoading,
  onFileChange, // <-- Use this prop
  isEditingMode = false, // Default to false if not provided
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
            onChange={(e) => onProductInfoChange("productName", e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="product-category" className="text-sm font-medium">
            Category
          </Label>
          <div className="flex gap-2">
            <Select
              onValueChange={onCategoryChange}
              value={selectedCategoryId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category">
                  {
                    categories.find((cat) => cat.id === selectedCategoryId)
                      ?.name
                  }
                </SelectValue>
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
          onChange={(e) => onProductInfoChange("description", e.target.value)}
          disabled={isLoading}
          rows={4}
        />
      </div>
      {/* File section */}
      {isEditingMode && (
        <div className="grid gap-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Attachment (optional)
          </Label>
          {productInfo.fileUrl && productInfo.filename ? (
            <div className="flex items-center gap-3 bg-slate-50 border rounded px-3 py-2 mb-2">
              <FileDown className="w-5 h-5 text-blue-600" />
              <a
                href={productInfo.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline text-sm break-all"
              >
                {productInfo.filename}
              </a>
            </div>
          ) : null}
          <input
            type="file"
            id="product-file"
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            onChange={(e) => {
              if (onFileChange) {
                onFileChange(e.target.files?.[0] || null);
              }
            }}
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
};

export default ProductInfoForm;
