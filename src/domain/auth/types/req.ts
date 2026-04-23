export interface LoginRequest {
  email: string;
  password: string;
}

export interface PasswordChangeRequest {
  originalPassword: string;
  newPassword: string;
}
