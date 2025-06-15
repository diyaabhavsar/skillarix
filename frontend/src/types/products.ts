export type Product = {
  _id: string;
  name: string;
  category_id: string;
  content: string;
  metadata: {
    title: string;
    author: string;
    creation_date: string;
    total_pages: number;
  };
  created_by: string;
  created_at: string;
  updated_at: string;
  updated_by: string;
  description: string | null;
}

