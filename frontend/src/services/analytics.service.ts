import type {
  AnalyticsOverview,
  ApiResponse,
  EndpointPoint,
  StatusCodePoint,
  TimelinePoint,
} from "../types";
import { apiRequest } from "./apiClient";

export function getOverview() {
  return apiRequest<ApiResponse<AnalyticsOverview>>("/analytics/overview");
}

export function getApiAnalytics(apiId: string) {
  return apiRequest<ApiResponse<AnalyticsOverview>>(
    `/analytics/apis/${apiId}`,
  );
}

export function getTimeline(apiId: string, range: "1d" | "7d" | "30d" = "7d") {
  return apiRequest<ApiResponse<TimelinePoint[]>>(
    `/analytics/apis/${apiId}/timeline?range=${range}`,
  );
}

export function getStatusCodes(apiId: string) {
  return apiRequest<ApiResponse<StatusCodePoint[]>>(
    `/analytics/apis/${apiId}/status-codes`,
  );
}

export function getTopEndpoints(apiId: string) {
  return apiRequest<ApiResponse<EndpointPoint[]>>(
    `/analytics/apis/${apiId}/top-endpoints`,
  );
}
