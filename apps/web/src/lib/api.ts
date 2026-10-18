export class ApiClientError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let activeRestaurantIdOverride: string | null = null;

export function setActiveRestaurantIdHeader(id: string | null) {
  activeRestaurantIdOverride = id;
  if (typeof window !== "undefined") {
    if (id) {
      window.localStorage.setItem("dp_active_restaurant_id", id);
    } else {
      window.localStorage.removeItem("dp_active_restaurant_id");
    }
  }
}

export function getActiveRestaurantIdHeader(): string | null {
  if (activeRestaurantIdOverride) return activeRestaurantIdOverride;
  if (typeof window !== "undefined") {
    return window.localStorage.getItem("dp_active_restaurant_id");
  }
  return null;
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = path.startsWith("/api/v1") ? path : `/api/v1${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  const restId = getActiveRestaurantIdHeader();
  if (restId && !headers.has("x-restaurant-id")) {
    headers.set("x-restaurant-id", restId);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new ApiClientError(
      res.status,
      json?.error?.code || "API_ERROR",
      json?.error?.message || `Request failed with status ${res.status}`,
      json?.error?.details
    );
  }

  return json.data as T;
}
