import { useState, useEffect } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
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
import { api } from "@/utils/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  active: true | false;
  sessions: number;
  lastActive: string;
};

const defaultForm = { name: "", email: "", password: "", role: "employee", active: true };

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
        const data = await api.get("/api/users");
        const mappedUsers: User[] = data.map((u: any) => ({
          id: u._id || u.id,
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

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleUserStatus = (userId: string) => {
    // In a real app, this would update the user's status in the database
    console.log(`Toggle status for user: ${userId}`);
  };

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

  // Handle create user
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      await api.post("/api/users", {
        username: addUserForm.name,
        email: addUserForm.email,
        password: addUserForm.password,
        role: addUserForm.role,
        active: addUserForm.active,
      });
      setAddUserForm({ ...defaultForm });
      setIsAddUserOpen(false);
      setLoading(true);
      const usersData = await api.get("/api/users");
      const mappedUsers: User[] = usersData.map((u: any) => ({
        id: u._id || u.id,
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

  // Handle edit user
  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditUserLoading(true);
    setEditUserError(null);
    try {
      const body: any = {
        username: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        active: editUserForm.active,
      };
      if (editUserForm.password) body.password = editUserForm.password;
      await api.put(`/api/users/${editUserForm.id}`, body);
      setIsEditUserOpen(false);
      setEditUserForm({ ...defaultForm, id: "" });
      setLoading(true);
      const usersData = await api.get("/api/users");
      const mappedUsers: User[] = usersData.map((u: any) => ({
        id: u._id || u.id,
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
  const openEditUser = (u: User) => {
    setEditUserForm({
      id: u.id,
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      active: u.active,
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
      const u = await api.get(`/api/users/${userId}`);
      setViewUser({
        id: u._id || u.id,
        name: u.username || u.name || "",
        email: u.email,
        role: u.role,
        active: u.active ?? true,
        sessions: u.sessions || 0,
        lastActive: u.last_login || "Unknown",
      });
    } catch {
      setViewUser(null);
    }
    setViewUserLoading(false);
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    setDeleteUserLoading(true);
    setDeleteUserError(null);
    try {
      await api.delete(`/api/users/${userId}`);
      setLoading(true);
      const usersData = await api.get("/api/users");
      const mappedUsers: User[] = usersData.map((u: any) => ({
        id: u._id || u.id,
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
          <Sheet open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <SheetTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl h-screen overflow-y-auto flex flex-col"
            >
              <SheetHeader>
                <SheetTitle>Add New User</SheetTitle>
                <SheetDescription>
                  Create a new user account. An invitation email will be sent to
                  the provided address.
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex-1 flex flex-col justify-start"
                onSubmit={handleAddUser}
              >
                <div className="flex flex-col gap-6 py-4 px-1">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="name" className="font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={addUserForm.name}
                      onChange={(e) =>
                        setAddUserForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="email" className="font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={addUserForm.email}
                      onChange={(e) =>
                        setAddUserForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="password" className="font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={addUserForm.password}
                        onChange={(e) =>
                          setAddUserForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }))
                        }
                        required
                        className="pr-10"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Role</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="employee"
                          name="role"
                          value="employee"
                          checked={addUserForm.role === "employee"}
                          onChange={() =>
                            setAddUserForm((f) => ({ ...f, role: "employee" }))
                          }
                        />
                        Employee
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="admin"
                          name="role"
                          value="admin"
                          checked={addUserForm.role === "admin"}
                          onChange={() =>
                            setAddUserForm((f) => ({ ...f, role: "admin" }))
                          }
                        />
                        Admin
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-medium" htmlFor="active-switch">
                      Active
                    </label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="active-switch"
                        checked={addUserForm.active ?? true}
                        onCheckedChange={(checked) =>
                          setAddUserForm((f) => ({ ...f, active: checked }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {addUserForm.active ?? true ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {addUserError && (
                    <div className="text-red-500 text-sm">{addUserError}</div>
                  )}
                </div>
                <SheetFooter className="mt-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddUserOpen(false)}
                    disabled={addUserLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addUserLoading}>
                    {addUserLoading ? "Adding..." : "Add User"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
          {/* Edit User Sheet */}
          <Sheet open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
            <SheetContent
              side="right"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl h-screen overflow-y-auto flex flex-col"
            >
              <SheetHeader>
                <SheetTitle>Edit User</SheetTitle>
                <SheetDescription>
                  Update user details. Leave password blank to keep unchanged.
                </SheetDescription>
              </SheetHeader>
              <form
                className="flex-1 flex flex-col justify-start"
                onSubmit={handleEditUser}
              >
                <div className="flex flex-col gap-6 py-4 px-1">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit-name" className="font-medium">
                      Name
                    </label>
                    <Input
                      id="edit-name"
                      value={editUserForm.name}
                      onChange={(e) =>
                        setEditUserForm((f) => ({ ...f, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="edit-email" className="font-medium">
                      Email
                    </label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={editUserForm.email}
                      onChange={(e) =>
                        setEditUserForm((f) => ({
                          ...f,
                          email: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 relative">
                    <label htmlFor="edit-password" className="font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        id="edit-password"
                        type={showEditPassword ? "text" : "password"}
                        value={editUserForm.password}
                        onChange={(e) =>
                          setEditUserForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }))
                        }
                        className="pr-10"
                        placeholder="Leave blank to keep unchanged"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                        tabIndex={-1}
                        onClick={() => setShowEditPassword((v) => !v)}
                        aria-label={
                          showEditPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showEditPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-medium">Role</label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="edit-employee"
                          name="edit-role"
                          value="employee"
                          checked={editUserForm.role === "employee"}
                          onChange={() =>
                            setEditUserForm((f) => ({ ...f, role: "employee" }))
                          }
                        />
                        Employee
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          id="edit-admin"
                          name="edit-role"
                          value="admin"
                          checked={editUserForm.role === "admin"}
                          onChange={() =>
                            setEditUserForm((f) => ({ ...f, role: "admin" }))
                          }
                        />
                        Admin
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-medium" htmlFor="edit-active-switch">
                      Active
                    </label>
                    <div className="flex items-center gap-3">
                      <Switch
                        id="edit-active-switch"
                        checked={editUserForm.active ?? true}
                        onCheckedChange={(checked) =>
                          setEditUserForm((f) => ({ ...f, active: checked }))
                        }
                      />
                      <span className="text-sm text-muted-foreground">
                        {editUserForm.active ?? true ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {editUserError && (
                    <div className="text-red-500 text-sm">{editUserError}</div>
                  )}
                </div>
                <SheetFooter className="mt-auto flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditUserOpen(false)}
                    disabled={editUserLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editUserLoading}>
                    {editUserLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
          {/* View User Sheet */}
          <Sheet open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
            <SheetContent
              side="right"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl h-screen overflow-y-auto flex flex-col"
            >
              <SheetHeader>
                <SheetTitle>User Information</SheetTitle>
                <SheetDescription>View user details.</SheetDescription>
              </SheetHeader>
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
              <SheetFooter className="mt-auto flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewUserOpen(false)}
                >
                  Close
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage all users in the SalesElevate platform
          </CardDescription>
        </CardHeader>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((userData) => (
                    <TableRow key={userData.id}>
                      <TableCell className="font-medium">
                        {userData.name}
                      </TableCell>
                      <TableCell>{userData.email}</TableCell>
                      <TableCell className="flex items-center">
                        <Badge
                          className={
                            userData.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {userData.role === "admin" ? "Admin" : "Employee"}
                        </Badge>
                      </TableCell>
                      <TableCell>{userData.sessions}</TableCell>
                      <TableCell>
                        {formatDateTime(userData.lastActive)}
                      </TableCell>
                      <TableCell>
                        {/* <div className="flex items-center gap-2">
                          <Switch
                            checked={userData.active}
                            onCheckedChange={() =>
                              handleToggleUserStatus(userData.id)
                            }
                            disabled={userData.email === user?.email}
                          />
                          <span
                            className={`text-sm ${
                              userData.active
                                ? "text-green-500"
                                : "text-muted-foreground"
                            }`}
                          >
                            {userData.active ? "Active" : "Inactive"}
                          </span>
                        </div> */}
                        <Badge
                          className={
                            userData.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }
                        >
                          {userData.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            <DropdownMenuItem
                              onClick={() => openEditUser(userData)}
                            >
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No users found matching your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* AlertDialog for delete confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userToDelete?.name}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteConfirmed}
              disabled={deleteUserLoading}
            >
              {deleteUserLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageUsers;
