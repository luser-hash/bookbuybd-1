import {
  PrintingCategory,
  PrintingItem,
  PrintingEstimatePayload,
  PrintingEstimateResponse,
  AddPrintingCartItemPayload,
  PrintingCartResponse,
  UpdatePrintingCartItemPayload,
  PrintingCheckoutPayload,
  PrintingCheckoutResponse,
} from "@/lib/types/printing";

const BASE_URL = (() => {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";
  const normalized = configured.endsWith("/") ? configured.slice(0, -1) : configured;

  // Use Next.js same-origin /api proxy in browser to avoid CORS/session issues.
  if (/^https?:\/\//i.test(normalized)) return "/api";

  return normalized;
})();

function resolveUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (BASE_URL.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${BASE_URL}${normalizedPath.slice(4)}`;
  }
  return `${BASE_URL}${normalizedPath}`;
}

function hasFileValue(value: unknown): value is File {
  return typeof File !== "undefined" && value instanceof File;
}

function buildCartItemBody(
  payload: AddPrintingCartItemPayload | UpdatePrintingCartItemPayload
): BodyInit {
  const hasFile =
    hasFileValue(payload.primary_file) ||
    hasFileValue(payload.secondary_file);

  if (!hasFile) return JSON.stringify(payload);

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => formData.append(key, String(item)));
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const isFormDataBody = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const hasRequestBody = options?.body !== undefined && options?.body !== null;
  const headers: HeadersInit = (isFormDataBody || !hasRequestBody)
    ? { ...(options?.headers || {}) }
    : {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      };

  const res = await fetch(resolveUrl(url), {
    ...options,
    // Printing cart/checkout is session-based; include cookies for cross-origin API URLs.
    credentials: "include",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    const errorData = contentType.includes("application/json")
      ? await res.json().catch(() => null)
      : await res.text().then((text) => ({ message: text })).catch(() => null);

    const message = typeof errorData?.detail === "string" && errorData.detail.trim()
      ? errorData.detail
      : typeof errorData?.message === "string" && errorData.message.trim()
        ? errorData.message
        : "Something went wrong";

    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  return res.json();
}

export function getPrintingCategories() {
  return apiFetch<PrintingCategory[]>("/api/printing/categories/");
}

export function getPrintingCategoryItems(categoryId: string) {
  return apiFetch<PrintingItem[]>(`/api/printing/categories/${categoryId}/items/`);
}

export function getPrintingEstimate(payload: PrintingEstimatePayload) {
  return apiFetch<PrintingEstimateResponse>("/api/printing/estimate/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPrintingCart() {
  return apiFetch<PrintingCartResponse>("/api/printing/cart/");
}

export function addPrintingCartItem(payload: AddPrintingCartItemPayload) {
  const body = buildCartItemBody(payload);
  return apiFetch<PrintingCartResponse>("/api/printing/cart/items/", {
    method: "POST",
    body,
  });
}

export function updatePrintingCartItem(pk: number, payload: UpdatePrintingCartItemPayload) {
  const body = buildCartItemBody(payload);
  return apiFetch<PrintingCartResponse>(`/api/printing/cart/items/${pk}/`, {
    method: "PATCH",
    body,
  });
}

export function deletePrintingCartItem(pk: number) {
  return apiFetch<PrintingCartResponse>(`/api/printing/cart/items/${pk}/`, {
    method: "DELETE",
  });
}

export function clearPrintingCart() {
  return apiFetch<PrintingCartResponse>("/api/printing/cart/", {
    method: "DELETE",
  });
}

export function checkoutPrinting(payload: PrintingCheckoutPayload) {
  return apiFetch<PrintingCheckoutResponse>("/api/printing/checkout/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
