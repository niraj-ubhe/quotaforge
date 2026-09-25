import type { ApiResponse, User } from "../types";
import { apiRequest } from "./apiClient";

export function register(payload: {
  name: string;
  email: string;
  password: string;
}) {
  return apiRequest<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function login(payload: { email: string; password: string }) {
  return apiRequest<
    ApiResponse<{ token: string; user: User }>
  >("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return apiRequest<ApiResponse<User>>("/auth/me");
}
