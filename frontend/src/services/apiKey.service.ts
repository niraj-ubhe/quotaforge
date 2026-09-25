import type { ApiKey, ApiResponse } from "../types";
import { apiRequest } from "./apiClient";

export function listApiKeys() {
  return apiRequest<ApiResponse<ApiKey[]>>("/api-keys");
}

export function createApiKey(payload: { apiId: string; name: string }) {
  return apiRequest<ApiResponse<{ key: string }>>("/api-keys", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function revokeApiKey(id: string) {
  return apiRequest<ApiResponse<ApiKey>>(`/api-keys/${id}/revoke`, {
    method: "PATCH",
  });
}

export function activateApiKey(id: string) {
  return apiRequest<ApiResponse<ApiKey>>(`/api-keys/${id}/activate`, {
    method: "PATCH",
  });
}
