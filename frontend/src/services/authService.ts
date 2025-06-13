import { env } from '@/config/env';
import { User, UserRole } from '@/types/session';
import { api } from '@/utils/api';

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
        console.log({formData})
      const response = await api.submitUrlEncodedForm('/token', formData);
      console.log({response})
      return {
        access_token: response.access_token,
        user: {
          id: response.id,
          email: response.email,
          name: response.username,
          role: response.role
        }
      };
    } catch (error: any) {
      throw new Error(error.detail || "Login failed");
    }
  },

  async register(data: RegisterData): Promise<void> {
    try {
      await api.post('/register', data);
    } catch (error: any) {
      throw new Error(error.detail || "Registration failed");
    }
  }
};