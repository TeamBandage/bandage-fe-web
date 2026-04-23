export type ApiResponse<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
  timestamp: string;
};

export type CursorResponse<T, C> = {
  content: T[];
  nextCursor: C | null;
  hasNext: boolean;
};
