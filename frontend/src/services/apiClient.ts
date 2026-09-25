const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function messageForStatus(status: number, fallback?: string) {
  if (status === 429) {
    return "Rate limit exceeded. Please wait before retrying.";
  }
  if (fallback) return fallback;
  if (status === 401) return "Unauthorized";
  if (status === 403) return "You do not have permission to do that.";
  if (status === 404) return "The requested resource was not found.";
  if (status === 409) return "This resource already exists.";
  if (status >= 500) return "Something went wrong. Please try again.";
  return "Request failed";
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  let response: Response;
  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(
      "Unable to reach the server. Check that the backend is running.",
      0,
    );
  }

  const text = await response.text();
  let payload: { success?: boolean; message?: string; data?: unknown } | null =
    null;

  if (text) {
    try {
      payload = JSON.parse(text) as typeof payload;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    const isAuthEndpoint =
      endpoint.startsWith("/auth/login") ||
      endpoint.startsWith("/auth/register");

    if (response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }

    throw new ApiError(
      messageForStatus(response.status, payload?.message),
      response.status,
    );
  }

  return payload as T;
}

export function getApiBaseUrl() {
  return API_URL;
}
