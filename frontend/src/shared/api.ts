// 환경변수에서 API URL 가져오기 (없으면 localhost 기본값 사용)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

// 인증 헤더를 자동으로 추가하는 헬퍼 함수
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function apiGet<T>(
  path: string,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed: ${res.status}`;
    throw new Error(`${res.status}: ${errorMessage}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed: ${res.status}`;
    throw new Error(`${res.status}: ${errorMessage}`);
  }
  return (await res.json()) as T;
}

export async function apiPut<T>(
  path: string,
  body?: unknown,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed: ${res.status}`;
    throw new Error(`${res.status}: ${errorMessage}`);
  }
  return (await res.json()) as T;
}

export async function apiDelete<T>(
  path: string,
  options?: { headers?: Record<string, string> }
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMessage = errorData.error || `Request failed: ${res.status}`;
    throw new Error(`${res.status}: ${errorMessage}`);
  }
  return (await res.json()) as T;
}
