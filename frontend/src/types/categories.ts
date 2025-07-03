export interface Category {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_by: string;
  updated_at: string;
}

export interface CategoryResponse {
  _id: string;
  name: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}