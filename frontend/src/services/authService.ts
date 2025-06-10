import { env } from '@/config/env';
import { User, UserRole } from '@/types/session';
import { api } from '@/utils/api';

interface LoginResponse {
  access_token: string;
  id: string;
  username: string;
  role: UserRole;
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
      return await api.submitUrlEncodedForm('/token', formData);
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