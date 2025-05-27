
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, MoreHorizontal, RefreshCw } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";

type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  status: "active" | "inactive";
  sessions: number;
  lastActive: string;
};

const ManageUsers = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const { user } = useAuth();
  
  // Mock users data
  const mockUsers: User[] = [
    {
      id: "1",
      name: "Emily Johnson",
      email: "emily@example.com",
      role: "employee",
      status: "active",
      sessions: 12,
      lastActive: "Today"
    },
    {
      id: "2",
      name: "Michael Chen",
      email: "michael@example.com",
      role: "employee",
      status: "active",
      sessions: 9,
      lastActive: "Yesterday"
    },
    {
      id: "3",
      name: "Sarah Williams",
      email: "sarah@example.com",
      role: "employee",
      status: "active",
      sessions: 15,
      lastActive: "May 12, 2023"
    },
    {
      id: "4",
      name: "David Miller",
      email: "david@example.com",
      role: "employee",
      status: "inactive",
      sessions: 7,
      lastActive: "April 28, 2023"
    },
    {
      id: "5",
      name: "John Smith",
      email: "john@example.com",
      role: "admin",
      status: "active",
      sessions: 23,
      lastActive: "Today"
    }
  ];
  
  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleToggleUserStatus = (userId: string) => {
    // In a real app, this would update the user's status in the database
    console.log(`Toggle status for user: ${userId}`);
  };

  return (
    <div className="container p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Users</h1>
          <p className="text-muted-foreground">Administer user accounts and permissions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. An invitation email will be sent to the provided address.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right">
                    Name
                  </label>
                  <Input id="name" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="email" className="text-right">
                    Email
                  </label>
                  <Input id="email" type="email" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="role" className="text-right">
                    Role
                  </label>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <input type="radio" id="employee" name="role" value="employee" defaultChecked />
                      <label htmlFor="employee">Employee</label>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <input type="radio" id="admin" name="role" value="admin" />
                      <label htmlFor="admin">Admin</label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddUserOpen(false)}>
                  Add User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                {filteredUsers.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell className="font-medium">{userData.name}</TableCell>
                    <TableCell>{userData.email}</TableCell>
                    <TableCell>
                      <Badge variant={userData.role === "admin" ? "default" : "outline"}>
                        {userData.role === "admin" ? "Admin" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>{userData.sessions}</TableCell>
                    <TableCell>{userData.lastActive}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={userData.status === "active"}
                          onCheckedChange={() => handleToggleUserStatus(userData.id)}
                          disabled={userData.email === user?.email} // Can't deactivate yourself
                        />
                        <span className={`text-sm ${userData.status === "active" ? "text-green-500" : "text-muted-foreground"}`}>
                          {userData.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <p className="text-muted-foreground">No users found matching your search criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ManageUsers;
