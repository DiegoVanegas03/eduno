export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: { path: (string | number)[]; message: string }[];
}
export interface IPaginatedResponse<T> extends IApiResponse<T> {
  pagination?: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
  };
}
