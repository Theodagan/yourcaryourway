export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  type: string;
  username: string;
  email: string;
}

export interface User {
  username: string;
  email: string;
  token: string;
}