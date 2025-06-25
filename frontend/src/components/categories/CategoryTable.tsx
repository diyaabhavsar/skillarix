import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryActions } from "@/components/categories/CategoryActions";
import { formatDate } from "@/utils/textFormatting";
import { Category } from "@/types/categories";
import ShadcnTable, { ShadcnColumn } from "@/components/ui/shadcn-table";

interface CategoryTableProps {
  categories: Category[];
  editingCategory: { id: string; name: string } | null;
  editCategoryName: string;
  onEditCategoryName: (value: string) => void;
  onUpdateCategory: () => void;
  onCancelEdit: () => void;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  loading: boolean; // Add this line
}

export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  editingCategory,
  editCategoryName,
  onEditCategoryName,
  onUpdateCategory,
  onCancelEdit,
  onEditCategory,
  onDeleteCategory,
  loading, // Add this line
}) => {
  const columns: ShadcnColumn<Category>[] = [
    {
      key: "sr_no",
      header: "Sr No.",
      className: "py-3 text-center w-[30px]",
      render: (_, row) => categories.indexOf(row) + 1,
    },
    {
      key: "name",
      header: "Name",
      className: "py-3 text-left w-[300px]",
      render: (value, row) =>
        editingCategory?.id === row.id ? (
          <div className="flex gap-4 items-center">
            <Input
              value={editCategoryName}
              onChange={(e) => onEditCategoryName(e.target.value)}
              className="max-w-[200px]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onUpdateCategory();
                }
              }}
            />
            <Button onClick={onUpdateCategory} size="sm">
              Save
            </Button>
            <Button variant="ghost" size="sm" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        ) : (
          value
        ),
    },
    {
      key: "created_at",
      header: "Created At",
      className: "py-3 text-left w-[200px]",
      render: (value) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      className: "py-3 text-center w-[50px]",
      render: (_, row) => (
        <div className="flex justify-left">
          <CategoryActions
            onEdit={() => onEditCategory(row.id)}
            onDelete={() => onDeleteCategory(row.id)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="rounded-md border mt-8 bg-white">
      <ShadcnTable
        columns={columns}
        data={categories}
        isLoading={loading}
        emptyMessage="No categories found."
        className="rounded-md border overflow-x-auto bg-muted/5 shadow-sm hover:shadow-md"
      />
    </div>
  );
};
