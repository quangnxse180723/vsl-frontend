// Extend existing types with API specifics

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  fullName: string;
  password?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
}

export interface UserResponse {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
  status: string;
  createdAt: string;
}
