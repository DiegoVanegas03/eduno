export interface IApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: { path: (string | number)[]; message: string }[];
}
