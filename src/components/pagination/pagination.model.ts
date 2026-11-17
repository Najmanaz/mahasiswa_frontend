export interface PaginationParams {
  page: number;
  limit: number;
  totalData: number;
}

export interface PaginationResult {
  currentPage: number;
  limit: number;
  totalData: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
