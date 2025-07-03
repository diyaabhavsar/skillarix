import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryActions } from "@/components/categories/CategoryActions";
import { formatDate } from "@/utils/textFormatting";
import { Category } from "@/types/categories";
import ShadcnTable from "@/components/ui/shadcnTable/shadcn-table";
import { ShadcnColumn } from "@/types/table-types";

interface CategoryTableProps {
  categories: Category[];
  editingCategory: { id: string; name: string } | null;
  editCategoryName: string;
  onEditCategoryName: (value: string) => void;
  onUpdateCategory: () => void;
  onCancelEdit: () => void;
  onEditCategory: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  loading: boolean;
  currentPage?: number;
  paginationData?: {
    skip: number;
    limit: number;
    count: number;
    total_count: number;
    total_pages: number;
  };
  onPageChange?: (page: number) => void;
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
  loading,
  currentPage = 1,
  paginationData,
  onPageChange,
}) => {
  const getSerialNumber = (index: number) => {
    if (!paginationData) return index + 1;
    return (currentPage - 1) * paginationData.limit + index + 1;
  };

  const columns: ShadcnColumn<Category>[] = [
    {
      key: "sr_no",
      header: "Sr No.",
      className: "py-3 text-center w-[30px]",
      render: (_: any, _row: Category, index: number) => getSerialNumber(index),
    },
    {
      key: "name",
      header: "Name",
      className: "py-3 text-left w-[300px]",
      render: (value: string, row: Category, _index: number) =>
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
      render: (value: string, _row: Category, _index: number) => formatDate(value),
    },
    {
      key: "actions",
      header: "Actions",
      className: "py-3 text-center w-[50px]",
      render: (_: any, row: Category, _index: number) => (
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
    <div>
      <ShadcnTable
        columns={columns}
        data={categories}
        isLoading={loading}
        currentPage={currentPage}
        paginationData={paginationData}
        onPageChange={onPageChange}
        showPagination={true}
        emptyMessage="No categories available."
        className="w-full"
      />
    </div>
  );
};
