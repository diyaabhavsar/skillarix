export interface PaginationData {
  skip: number;
  limit: number;
  count: number;
  total_count: number;
  total_pages: number;
}

export interface ShadcnColumn<T = any> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

export interface ShadcnTableProps<T = any> {
  columns: ShadcnColumn<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  rowClassName?: string | ((row: T, index: number) => string);
  onRowClick?: (row: T) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  filters?: React.ReactNode;
  // Pagination props
  showPagination?: boolean;
  currentPage?: number;
  paginationData?: PaginationData;
  onPageChange?: (page: number) => void;
}
