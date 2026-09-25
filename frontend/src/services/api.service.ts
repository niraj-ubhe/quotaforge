import type { Api, ApiResponse, RateLimitAlgorithm } from "../types";
import { apiRequest } from "./apiClient";

export function listApis() {
  return apiRequest<ApiResponse<Api[]>>("/apis");
}

export function createApi(payload: {
  name: string;
  baseUrl: string;
  description?: string;
}) {
  return apiRequest<ApiResponse<Api>>("/apis", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateApi(
  id: string,
  payload: {
    name?: string;
    baseUrl?: string;
    description?: string;
    requestsPerMinute?: number;
    rateLimitAlgorithm?: RateLimitAlgorithm;
  },
) {
  return apiRequest<ApiResponse<Api>>(`/apis/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
