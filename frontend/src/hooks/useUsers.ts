import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import { User, ApiUser } from '@/types/users';

interface UsersResponse {
  data: ApiUser[];
  page: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [usersResponse, setUsersResponse] = useState<UsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();

  // Map API user to frontend User type
  const mapApiUserToUser = (u: ApiUser): User => {
    // Basic fallbacks for name display
    const name = u.username || u.name || (u as any).full_name || u.email || "Unnamed User";
    return {
      id: u._id || u.id || "",
      name: name,
      email: u.email,
      role: u.role,
      active: u.active ?? true,
      sessions: u.sessions || 0,
      lastActive: u.last_login || "Unknown",
    };
  };

  // Fetch users with pagination
  const fetchUsers = async (page: number = 1, limit: number = 10) => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data: any = await api.get(`/users?page=${page}&limit=${limit}`);

      // Handle different possible response formats
      let usersToMap: ApiUser[] = [];
      let responseData: UsersResponse;

      // Case 1: Response has data property with array (paginated) - Your current format
      if (data.data && Array.isArray(data.data)) {
        usersToMap = data.data;
        const totalCount = data.total_count || data.total || data.count || usersToMap.length;
        const totalPages = Math.ceil(totalCount / limit);

        responseData = {
          data: usersToMap,
          page: data.page || page,
          limit: limit,
          count: usersToMap.length,
          total_count: totalCount,
          total_pages: totalPages
        };
      }
      // Case 2: Response is directly an array (non-paginated fallback)
      else if (Array.isArray(data)) {
        usersToMap = data;
        responseData = {
          data: usersToMap,
          page: 1,
          limit: usersToMap.length,
          count: usersToMap.length,
          total_count: usersToMap.length,
          total_pages: 1
        };
      }
      // Case 3: Other structure - fallback
      else {
        console.warn('Unexpected API response format:', data);
        usersToMap = [];
        responseData = {
          data: [],
          page: page,
          limit: limit,
          count: 0,
          total_count: 0,
          total_pages: 0
        };
      }

      const mappedUsers: User[] = usersToMap.map(mapApiUserToUser);
      setUsers(mappedUsers);
      setUsersResponse(responseData);

    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast.error(`Failed to load users: ${error.message}`);
      setUsers([]);
      setUsersResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users (for dropdowns, etc.)
  const fetchAllUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response: any = await api.get("/users");

      // Handle the case where the API returns { data: [...] } (paginated format)
      let usersToMap: ApiUser[] = [];
      if (response && response.data && Array.isArray(response.data)) {
        usersToMap = response.data;
      } else if (Array.isArray(response)) {
        usersToMap = response;
      }

      const mappedUsers: User[] = usersToMap.map(mapApiUserToUser);
      setUsers(mappedUsers);
      setUsersResponse(null);
    } catch (error: any) {
      console.error("Error fetching all users:", error);
      toast.error(`Failed to load users: ${error.message}`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Create user
  const createUser = async (userData: {
    username: string;
    email: string;
    password: string;
    role: string;
    active: boolean;
  }, currentPage: number = 1, limit: number = 10) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.post("/users", userData);
      // Refresh current page after creation
      await fetchUsers(currentPage, limit);
      toast.success('User created successfully');
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(`Failed to create user: ${error.message}`);
      throw error;
    }
  };

  // Update user
  const updateUser = async (userId: string, userData: {
    username: string;
    email: string;
    role: string;
    active: boolean;
    password?: string;
  }, currentPage: number = 1, limit: number = 10) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.put(`/users/${userId}`, userData);
      // Refresh current page after update
      await fetchUsers(currentPage, limit);
      toast.success('User updated successfully');
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast.error(`Failed to update user: ${error.message}`);
      throw error;
    }
  };

  // Delete user
  const deleteUser = async (userId: string, currentPage: number = 1, usersLength: number = 0, limit: number = 10) => {
    if (!token) throw new Error("Not authenticated");
    try {
      await api.delete(`/users/${userId}`);

      // If this was the last item on the current page and not on page 1, go to previous page
      if (usersLength === 1 && currentPage > 1) {
        const newPage = currentPage - 1;
        await fetchUsers(newPage, limit);
        return newPage; // Return new page number
      } else {
        // Otherwise refresh current page
        await fetchUsers(currentPage, limit);
        return currentPage;
      }
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(`Failed to delete user: ${error.message}`);
      throw error;
    }
  };

  // Get user by ID
  const getUserById = async (userId: string): Promise<User | null> => {
    if (!token) return null;
    try {
      const user = await api.get<ApiUser>(`/users/${userId}`);
      return mapApiUserToUser(user);
    } catch (error: any) {
      console.error("Error fetching user by ID:", error);
      return null;
    }
  };

  return {
    users,
    usersResponse,
    isLoading,
    setUsers,
    fetchUsers,
    fetchAllUsers,
    createUser,
    updateUser,
    deleteUser,
    getUserById
  };
};