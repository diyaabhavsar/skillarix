import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryHeader } from "@/components/products/SetupHeader";

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
      <CategoryHeader onToggleInput={onToggleInput} />

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
