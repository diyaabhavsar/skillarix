import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, MoreHorizontal, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import SideSheet from "@/components/SideSheet";
import ShadcnTable from "@/components/ui/shadcnTable/shadcn-table";
import { User } from "@/types/users";
import ManageUserForm from "@/components/manageUser/ManageUserForm";
import { useUsers } from "@/hooks/useUsers";
import { PaginationData, ShadcnColumn } from "@/types/table-types";

// Helper functions outside component
const formatDateTime = (dateTimeStr: string) => {
  if (!dateTimeStr) return "";
  const date = new Date(dateTimeStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

// Delete confirmation dialog component
const DeleteUserDialog = ({
  open,
  onOpenChange,
  user,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => void;
  loading: boolean;
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Delete User</AlertDialogTitle>
        <AlertDialogDescription>
          Are you sure you want to delete{" "}
          <span className="font-semibold">{user?.name}</span>? This action
          cannot be undone.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          className="bg-red-600 hover:bg-red-700"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Deleting..." : "Delete"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "employee" as "admin" | "employee",
  active: true,
};

const UserHeader = () => (
  <div>
    <h1 className="text-3xl font-bold">Manage Users</h1>
    <p className="text-muted-foreground">
      Administer user accounts and permissions
    </p>
  </div>
);

const UserActions = ({
  onRefresh,
  isAddUserOpen,
  setIsAddUserOpen,
  addUserForm,
  setAddUserForm,
  addUserLoading,
  addUserError,
  handleAddUser,
}: any) => (
  <>
    <Button variant="outline" onClick={onRefresh}>
      <RefreshCw className="h-4 w-4 mr-2" />
      Refresh
    </Button>
    <SideSheet
      open={isAddUserOpen}
      onOpenChange={setIsAddUserOpen}
      title="Add New User"
      description="Create a new user account. An invitation email will be sent to the provided address."
      trigger={
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      }
    >
      <ManageUserForm
        form={addUserForm}
        setForm={setAddUserForm}
        loading={addUserLoading}
        error={addUserError}
        onSubmit={handleAddUser}
        onCancel={() => setIsAddUserOpen(false)}
      />
    </SideSheet>
  </>
);

const UserViewSheet = ({
  isViewUserOpen,
  setIsViewUserOpen,
  viewUserLoading,
  viewUser,
  formatDateTime,
}: any) => (
  <SideSheet
    open={isViewUserOpen}
    onOpenChange={setIsViewUserOpen}
    title="View User"
    description="View user details and activity."
    footer={
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsViewUserOpen(false)}
      >
        Close
      </Button>
    }
  >
    {viewUserLoading ? (
      <div className="flex-1 flex items-center justify-center">Loading...</div>
    ) : viewUser ? (
      <div className="flex-1 flex flex-col gap-6 py-4 px-1">
        <div className="flex flex-col gap-2">
          <span className="font-medium">Name:</span>{" "}
          <span>{viewUser.name}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Email:</span>{" "}
          <span>{viewUser.email}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Role:</span>{" "}
          <span
            className={
              viewUser.role === "admin" ? "text-blue-500" : "text-gray-500"
            }
          >
            {viewUser.role === "admin" ? "Admin" : "Employee"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Status:</span>{" "}
          <span
            className={
              viewUser.active ? "text-green-500" : "text-muted-foreground"
            }
          >
            {viewUser.active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Sessions:</span>{" "}
          <span>{viewUser.sessions}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium">Last Active:</span>{" "}
          <span>{formatDateTime(viewUser.lastActive)}</span>
        </div>
      </div>
    ) : (
      <div className="flex-1 flex items-center justify-center text-red-500">
        Failed to load user info.
      </div>
    )}
  </SideSheet>
);

const UserTableCard = ({
  columns,
  users,
  loading,
  showPagination = false,
  currentPage,
  paginationData,
  onPageChange,
}: any) => (
  <ShadcnTable
    columns={columns}
    data={users.map((userData: any) => ({
      ...userData,
      lastActive: formatDateTime(userData.lastActive),
      status: userData.active ? "Active" : "Inactive",
    }))}
    isLoading={loading}
    emptyMessage="No users found matching your search criteria."
    searchable={true}
    searchPlaceholder="Search users..."
    searchKeys={["name", "email"]}
    showPagination={showPagination}
    currentPage={currentPage}
    paginationData={paginationData}
    onPageChange={onPageChange}
  />
);

const ManageUsers = () => {
  // Use the custom hook
  const {
    users,
    usersResponse,
    isLoading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById,
  } = useUsers();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationData, setPaginationData] = useState<PaginationData>({
    skip: 0,
    limit: 10,
    count: 0,
    total_count: 0,
    total_pages: 1,
  });
  const [addUserForm, setAddUserForm] = useState({ ...defaultForm });
  const [editUserForm, setEditUserForm] = useState({ ...defaultForm, id: "" });
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [viewUserLoading, setViewUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { user } = useAuth();

  // Function to handle page changes
  const handlePageChange = async (page: number) => {
    try {
      setCurrentPage(page);
      await fetchUsers(page, 10);
    } catch (error) {
      console.error("Failed to fetch page:", page, error);
    }
  };

  // Update pagination data when users response changes
  useEffect(() => {
    if (usersResponse) {
      const newPaginationData = {
        skip: (usersResponse.page - 1) * usersResponse.limit || 0,
        limit: usersResponse.limit || 10,
        count: usersResponse.count || 0,
        total_count: usersResponse.total_count || 0,
        total_pages: usersResponse.total_pages || 1,
      };
      setPaginationData(newPaginationData);
    } else if (users.length > 0) {
      // Fallback when no pagination response (backward compatibility)
      const fallbackPaginationData = {
        skip: 0,
        limit: users.length,
        count: users.length,
        total_count: users.length,
        total_pages: 1,
      };
      setPaginationData(fallbackPaginationData);
    }
  }, [usersResponse, users]);

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers(currentPage, 10);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle create user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      await createUser(
        {
          username: addUserForm.name,
          email: addUserForm.email,
          password: addUserForm.password,
          role: addUserForm.role,
          active: addUserForm.active,
        },
        currentPage,
        5 // Use limit of 5 to test pagination
      );
      setAddUserForm({ ...defaultForm });
      setIsAddUserOpen(false);
    } catch (err: any) {
      setAddUserError(err.message || "Failed to create user");
    }
    setAddUserLoading(false);
  };

  // Handle edit user
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditUserLoading(true);
    setEditUserError(null);
    try {
      const body = {
        username: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        active: editUserForm.active,
        ...(editUserForm.password ? { password: editUserForm.password } : {}),
      };
      await updateUser(editUserForm.id, body, currentPage, 5); // Use limit of 5
      setIsEditUserOpen(false);
      setEditUserForm({ ...defaultForm, id: "" });
    } catch (err: any) {
      setEditUserError(err.message || "Failed to update user");
    }
    setEditUserLoading(false);
  };

  // Open edit sheet and populate form
  const openEditUser = (user: User) => {
    setEditUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      password: "",
      role: user.role === "admin" ? "admin" : "employee",
      active: user.active,
    });
    setEditUserError(null);
    setIsEditUserOpen(true);
  };

  // Open view sheet and fetch user info
  const openViewUser = async (userId: string) => {
    setViewUserLoading(true);
    setIsViewUserOpen(true);
    try {
      const user = await getUserById(userId);
      setViewUser(user);
    } catch {
      setViewUser(null);
    }
    setViewUserLoading(false);
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    setDeleteUserLoading(true);
    try {
      const newPage = await deleteUser(userId, currentPage, users.length, 5); // Use limit of 5
      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      }
    } catch (err: any) {
      // Error handling is done in the hook
    }
    setDeleteUserLoading(false);
  };

  // Modified delete handler to use dialog
  const confirmDeleteUser = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!userToDelete) return;
    await handleDeleteUser(userToDelete.id);
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  // Define columns for ShadcnTable
  const columns: ShadcnColumn<any>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    {
      key: "role",
      header: "Role",
      render: (value) => (
        <span
          className={
            value === "admin" ? "text-blue-600 font-semibold" : "text-gray-700"
          }
        >
          {value === "admin" ? "Admin" : "Employee"}
        </span>
      ),
    },
    { key: "sessions", header: "Sessions" },
    { key: "lastActive", header: "Last Active" },
    {
      key: "status",
      header: "Status",
      render: (value) => (
        <span
          className={
            value === "Active"
              ? "text-green-600 font-semibold"
              : "text-red-500 font-semibold"
          }
        >
          {value}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "w-[80px]",
      render: (_value, userData) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openViewUser(userData.id)}>
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openEditUser(userData)}>
              Edit
            </DropdownMenuItem>
            {userData.email !== user?.email && (
              <DropdownMenuItem
                className="text-red-500"
                onClick={() => confirmDeleteUser(userData)}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <UserHeader />
        <div className="flex gap-3">
          <UserActions
            onRefresh={() => fetchUsers(currentPage, 5)} // Use limit of 5
            isAddUserOpen={isAddUserOpen}
            setIsAddUserOpen={setIsAddUserOpen}
            addUserForm={addUserForm}
            setAddUserForm={setAddUserForm}
            addUserLoading={addUserLoading}
            addUserError={addUserError}
            handleAddUser={handleAddUser}
          />
          <SideSheet
            open={isEditUserOpen}
            onOpenChange={setIsEditUserOpen}
            title="Edit User"
            description="Update user information."
          >
            <ManageUserForm
              form={editUserForm}
              setForm={setEditUserForm}
              loading={editUserLoading}
              error={editUserError}
              onSubmit={handleEditUser}
              isEdit
              onCancel={() => setIsEditUserOpen(false)}
            />
          </SideSheet>
          <UserViewSheet
            isViewUserOpen={isViewUserOpen}
            setIsViewUserOpen={setIsViewUserOpen}
            viewUserLoading={viewUserLoading}
            viewUser={viewUser}
            formatDateTime={formatDateTime}
          />
        </div>
      </div>
      <div className="my-8">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <UserTableCard
            columns={columns}
            users={users}
            loading={false}
            showPagination={true}
            currentPage={currentPage}
            paginationData={paginationData}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
      <DeleteUserDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        user={userToDelete}
        onConfirm={handleDeleteConfirmed}
        loading={deleteUserLoading}
      />
    </div>
  );
};

export default ManageUsers;
