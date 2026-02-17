import { UserRole } from "@/types/session";
import { api } from "@/utils/api";

interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const formData = new URLSearchParams({ username: email, password });
      const response = await api.submitUrlEncodedForm("/auth/login", formData);
      return {
        access_token: response.access_token,
        user: {
          id: response.id,
          email: response.email,
          name: response.username,
          role: response.role,
        },
      };
    } catch (error: any) {
      throw new Error(error.detail || "Login failed");
    }
  },

  async register(data: RegisterData): Promise<void> {
    try {
      await api.post("/users", data);
    } catch (error: any) {
      throw new Error(error.detail || "Registration failed");
    }
  },

  async updateProfile(data: { name?: string; email?: string }): Promise<any> {
    try {
      // The backend expects "username" or "full_name" or "name"
      // Let's send "username" as the display name
      const payload = {
        username: data.name,
        email: data.email
      };
      return await api.put("/users/profile", payload);
    } catch (error: any) {
      throw new Error(error.detail || "Profile update failed");
    }
  },
};
