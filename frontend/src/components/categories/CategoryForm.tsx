import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CategoryFormProps {
  showInput: boolean;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
  onToggleInput: () => void;
  onCancel: () => void;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({
  showInput,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
  onToggleInput,
  onCancel,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent pb-1">
            Categories
          </h1>
          <p className="text-muted-foreground">
            Manage your product categories
          </p>
        </div>
        <Button className="group transition-all" onClick={onToggleInput}>
          <Plus className="h-4 w-4 mr-2" />
          <span>Add Category</span>
        </Button>
      </div>

      {showInput && (
        <div className="flex gap-4 items-center mb-6">
          <Input
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            className="max-w-[300px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onCreateCategory();
              }
            }}
          />
          <Button onClick={onCreateCategory}>Create</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};
