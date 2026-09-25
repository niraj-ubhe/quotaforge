export type RateLimitAlgorithm =
  | "FIXED_WINDOW"
  | "SLIDING_WINDOW"
  | "TOKEN_BUCKET";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Api {
  id: string;
  name: string;
  description?: string | null;
  baseUrl: string;
  ownerId: string;
  requestsPerMinute: number;
  rateLimitAlgorithm: RateLimitAlgorithm;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  apiId: string;
}

export interface AnalyticsOverview {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

export interface TimelinePoint {
  date: string;
  requests: number;
}

export interface StatusCodePoint {
  statusCode: number;
  requests: number;
}

export interface EndpointPoint {
  path: string;
  requests: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}
