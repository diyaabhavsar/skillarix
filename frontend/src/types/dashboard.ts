export interface DashboardUser {
  _id: string;
  username: string;
  email: string;
  active: boolean;
  role: string;
}

export interface DashboardSession {
  _id: string;
  user_name: string;
  product_name: string;
  score?: number;
  created_at?: string;
}

// Add this interface with the other interfaces
export interface DashboardStats {
  total_users: number;
  sessions_completed: number;
  average_score: number;
  products: number;
}