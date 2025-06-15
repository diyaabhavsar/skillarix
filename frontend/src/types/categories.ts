export type Category = {
  id: string;
  name: string;
  created_by?: string;
  created_at?: string;
};

export type CategoryResponse = {
  _id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  updated_by: string;
};