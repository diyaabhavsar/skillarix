import React, { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

const Categories = () => {
  const {
    categories,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useProducts();
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editCategoryName, setEditCategoryName] = useState("");
  const [showInput, setShowInput] = useState(false);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Please enter a category name.");
      return;
    }
    try {
      await createCategory(newCategoryName);
      await fetchCategories(); // Refresh to show the new category in the table
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
      await updateCategory(editingCategory.id, editCategoryName);
      await fetchCategories(); // Refresh the categories list
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
            <Button
              className="group transition-all"
              onClick={() => setShowInput(!showInput)}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span>Add Category</span>
            </Button>
          </div>

          {showInput && (
            <div className="flex gap-4 items-center mb-6">
              <Input
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="max-w-[300px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreateCategory();
                  }
                }}
              />
              <Button onClick={handleCreateCategory}>Create</Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowInput(false);
                  setNewCategoryName("");
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>{" "}
        <div className="rounded-md border mt-8">
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
              {categories.map((category, index) => (
                <TableRow key={category.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {editingCategory?.id === category.id ? (
                      <div className="flex gap-4 items-center">
                        <Input
                          value={editCategoryName}
                          onChange={(e) => setEditCategoryName(e.target.value)}
                          className="max-w-[200px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateCategory();
                            }
                          }}
                        />
                        <Button onClick={handleUpdateCategory} size="sm">
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCategory(null);
                            setEditCategoryName("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      category.name
                    )}
                  </TableCell>
                  <TableCell>{formatDate(category.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditCategory(category.id)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setCategoryToDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <AlertDialog
          open={!!categoryToDelete}
          onOpenChange={() => setCategoryToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                category and may affect products associated with it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCategory}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

export default Categories;
