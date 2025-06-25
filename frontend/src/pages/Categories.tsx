import React, { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { toast } from "sonner";
import { CategoryTable } from "@/components/categories/CategoryTable";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import { Category } from "@/types/categories";
import { capitalizeWords } from "@/utils/textFormatting";

const Categories = () => {
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = useProducts();
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
      await createCategory(capitalizeWords(newCategoryName));
      await fetchCategories();
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
      await updateCategory(editingCategory.id, capitalizeWords(editCategoryName));
      await fetchCategories();
      setEditingCategory(null);
      setEditCategoryName("");
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete);
      setCategoryToDelete(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

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
          loading={isLoading}
          onDeleteCategory={setCategoryToDelete}
        />

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
