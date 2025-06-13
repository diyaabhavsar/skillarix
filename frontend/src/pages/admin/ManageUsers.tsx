import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import SideSheet from "@/components/SideSheet";
import DataTable from "@/components/DataTable";
import { api } from "@/utils/api";
import { User, ApiUser } from "@/types/users";
import ManageUserForm from "@/components/manageUser/ManageUserForm";

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

// Error display component
const ErrorMessage = ({ error }: { error: string | null }) => {
  if (!error) return null;
  return <div className="text-red-500 text-sm">{error}</div>;
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

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addUserForm, setAddUserForm] = useState({ ...defaultForm });
  const [editUserForm, setEditUserForm] = useState({ ...defaultForm, id: "" });
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [editUserError, setEditUserError] = useState<string | null>(null);
  const [viewUserLoading, setViewUserLoading] = useState(false);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { user, token } = useAuth();

  // Fetch users from backend API
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await api.get<ApiUser[]>("/users");
        const mappedUsers: User[] = data.map((u: ApiUser) => ({
          id: u._id || u.id || "",
          name: u.username || u.name || "",
          email: u.email,
          role: u.role,
          active: u.active ?? true,
          sessions: u.sessions || 0,
          lastActive: u.last_login || "Unknown",
        }));
        setUsers(mappedUsers);
      } catch {
        setUsers([]);
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  // Memoize filtered users
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [users, searchQuery]
  );

  // Add type for GetUsersResponse
  type GetUsersResponse = ApiUser[];

  // Handle create user and reload users with proper typing
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      await api.post("/users", {
        username: addUserForm.name,
        email: addUserForm.email,
        password: addUserForm.password,
        role: addUserForm.role,
        active: addUserForm.active,
      });
      setAddUserForm({ ...defaultForm });
      setIsAddUserOpen(false);
      setLoading(true);
      const usersData = await api.get<GetUsersResponse>("/users");
      const mappedUsers: User[] = usersData.map((u) => ({
        id: u._id || u.id || "",
        name: u.username || u.name || "",
        email: u.email,
        role: u.role,
        active: u.active ?? true,
        sessions: u.sessions || 0,
        lastActive: u.last_login || "Unknown",
      }));
      setUsers(mappedUsers);
      setLoading(false);
    } catch (err: any) {
      setAddUserError(err.message || "Failed to create user");
      setAddUserLoading(false);
    }
    setAddUserLoading(false);
  };

  // Handle edit user with proper typing
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
      await api.put(`/api/users/${editUserForm.id}`, body);
      setIsEditUserOpen(false);
      setEditUserForm({ ...defaultForm, id: "" });
      setLoading(true);
      const usersData = await api.get<GetUsersResponse>("/users");
      const mappedUsers: User[] = usersData.map((u) => ({
        id: u._id || u.id || "",
        name: u.username || u.name || "",
        email: u.email,
        role: u.role,
        active: u.active ?? true,
        sessions: u.sessions || 0,
        lastActive: u.last_login || "Unknown",
      }));
      setUsers(mappedUsers);
      setLoading(false);
    } catch (err: any) {
      setEditUserError(err.message || "Failed to update user");
      setEditUserLoading(false);
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
    setShowEditPassword(false);
    setEditUserError(null);
    setIsEditUserOpen(true);
  };

  // Open view sheet and fetch user info
  const openViewUser = async (userId: string) => {
    setViewUserLoading(true);
    setIsViewUserOpen(true);
    try {
      const user = await api.get<ApiUser>(`/users/${userId}`);
      setViewUser({
        id: user._id || user.id || "",
        name: user.username || user.name || "",
        email: user.email,
        role: user.role,
        active: user.active ?? true,
        sessions: user.sessions || 0,
        lastActive: user.last_login || "Unknown",
      });
    } catch {
      setViewUser(null);
    }
    setViewUserLoading(false);
  };

  // Handle delete user with proper typing
  const handleDeleteUser = async (userId: string) => {
    setDeleteUserLoading(true);
    setDeleteUserError(null);
    try {
      await api.delete(`/api/users/${userId}`);
      setLoading(true);
      const usersData = await api.get<GetUsersResponse>("/users");
      const mappedUsers: User[] = usersData.map((u) => ({
        id: u._id || u.id || "",
        name: u.username || u.name || "",
        email: u.email,
        role: u.role,
        active: u.active ?? true,
        sessions: u.sessions || 0,
        lastActive: u.last_login || "Unknown",
      }));
      setUsers(mappedUsers);
      setLoading(false);
    } catch (err: any) {
      setDeleteUserError(err.message || "Failed to delete user");
      setDeleteUserLoading(false);
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

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">
            Administer user accounts and permissions
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {/* Add User Sheet */}
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
          {/* Edit User Sheet */}
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
          {/* View User Sheet */}
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
              <div className="flex-1 flex items-center justify-center">
                Loading...
              </div>
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
                      viewUser.role === "admin"
                        ? "text-blue-500"
                        : "text-gray-500"
                    }
                  >
                    {viewUser.role === "admin" ? "Admin" : "Employee"}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={
                      viewUser.active
                        ? "text-green-500"
                        : "text-muted-foreground"
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
        </div>
      </div>

      <Card>
        <CardHeader></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="rounded-md border">
            <DataTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "role", label: "Role" },
                { key: "sessions", label: "Sessions" },
                { key: "lastActive", label: "Last Active" },
                { key: "status", label: "Status" },
                { key: "actions", label: "Actions", className: "w-[80px]" },
              ]}
              data={filteredUsers.map((userData) => ({
                ...userData,
                lastActive: formatDateTime(userData.lastActive),
                status: userData.active ? "Active" : "Inactive",
                actions: (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openViewUser(userData.id)}
                      >
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
              }))}
              loading={loading}
              emptyMessage="No users found matching your search criteria."
            />
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog for delete confirmation */}
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
