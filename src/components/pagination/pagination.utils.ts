import type {
  PaginationParams,
  PaginationResult,
} from "./pagination.model";

export const createPagination = ({
  page,
  limit,
  totalData,
}: PaginationParams): PaginationResult => {
  const totalPages = Math.ceil(totalData / limit);

  return {
    currentPage: page,
    limit,
    totalData,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

export const getPaginationOffset = (
  page: number,
  limit: number
): number => {
  return (page - 1) * limit;
};
