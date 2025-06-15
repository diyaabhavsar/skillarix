import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryActions } from "@/components/categories/CategoryActions";
import { formatDate } from "@/utils/textFormatting";
import { Category } from "@/types/categories";

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
  return (
    <div className="rounded-md border mt-8 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Sr No.</TableHead>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead className="w-[200px]">Created At</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Loading categories...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No categories found.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  {editingCategory?.id === category.id ? (
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
                    category.name
                  )}
                </TableCell>
                <TableCell>{formatDate(category.created_at)}</TableCell>
                <TableCell className="text-right">
                  <CategoryActions
                    onEdit={() => onEditCategory(category.id)}
                    onDelete={() => onDeleteCategory(category.id)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
