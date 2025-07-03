import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/useCategories";
import { toast } from "sonner";
import { CategoryTable } from "@/components/categories/CategoryTable";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import { Category } from "@/types/categories";
import { capitalizeWords } from "@/utils/textFormatting";

interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

const Categories = () => {
  const {
    categories,
    fetchCategories,
    categoriesResponse,
    createCategory,
    updateCategory,
    deleteCategory,
    isCategoriesLoading,
  } = useCategories();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    skip: 0,
    limit: 10,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Pick<
    Category,
    "id" | "name"
  > | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    try {
      await createCategory(capitalizeWords(newCategoryName), currentPage);
      setNewCategoryName("");
      setShowInput(false);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEditCategory = async (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setEditCategoryName(category.name);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    try {
      await updateCategory(editingCategory.id, capitalizeWords(editCategoryName), currentPage);
      setEditingCategory(null);
      setEditCategoryName("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      // If this was the last item on the current page and not on page 1, go to previous page
      if (categories.length === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        setCurrentPage(newPage);
        await deleteCategory(categoryToDelete, newPage);
      } else {
        await deleteCategory(categoryToDelete, currentPage);
      }
      setCategoryToDelete(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  // Function to handle page changes
  const handlePageChange = async (page: number) => {
    try {
      setCurrentPage(page);
      await fetchCategories(page);
    } catch (error) {
      console.error("Failed to fetch page:", page, error);
      toast.error("Failed to load page " + page);
    }
  };

  // Update pagination data when categories response changes
  useEffect(() => {
    if (categoriesResponse) {
      setPaginationData({
        skip: ((categoriesResponse.page - 1) * categoriesResponse.limit) || 0,
        limit: categoriesResponse.limit || 10,
        count: categoriesResponse.count || 0,
        total_count: categoriesResponse.total_count || 0,
        total_pages: categoriesResponse.total_pages || 1,
      });
    }
  }, [categoriesResponse]);

  // Load initial categories
  useEffect(() => {
    fetchCategories(currentPage);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8">
        <CategoryForm
          showInput={showInput}
          newCategoryName={newCategoryName}
          onNewCategoryNameChange={setNewCategoryName}
          onCreateCategory={handleCreateCategory}
          onToggleInput={() => setShowInput(!showInput)}
          onCancel={() => {
            setShowInput(false);
            setNewCategoryName("");
          }}
        />

        <div className="my-8">
          <div className="relative">
            {isCategoriesLoading && (
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <CategoryTable
              categories={categories}
              editingCategory={editingCategory}
              editCategoryName={editCategoryName}
              onEditCategoryName={setEditCategoryName}
              onUpdateCategory={handleUpdateCategory}
              onCancelEdit={() => {
                setEditingCategory(null);
                setEditCategoryName("");
              }}
              onEditCategory={handleEditCategory}
              loading={isCategoriesLoading}
              onDeleteCategory={setCategoryToDelete}
              currentPage={currentPage}
              paginationData={paginationData}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        <DeleteCategoryDialog
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDeleteCategory}
        />
      </main>
    </div>
  );
};

export default Categories;
