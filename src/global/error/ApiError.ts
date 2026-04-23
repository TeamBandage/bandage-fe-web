export type ApiErrorFieldErrors = Record<string, string>;

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly fieldErrors?: ApiErrorFieldErrors;

  constructor(code: string, message: string, status: number, fieldErrors?: ApiErrorFieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;

    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
