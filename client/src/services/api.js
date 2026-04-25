const API_URL = import.meta.env.VITE_API_URL || '';

let accessToken = null;

export function setToken(token) {
  accessToken = token;
}

export function getToken() {
  return accessToken;
}

export function clearToken() {
  accessToken = null;
}

export function isBackendEnabled() {
  return !!API_URL;
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/refresh') {
    // Try to refresh the token
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      const retry = await fetch(url, { ...options, headers, credentials: 'include' });
      if (!retry.ok) throw new ApiError(retry.status, await retry.text());
      return retry.json();
    }
    throw new ApiError(401, 'Session expired');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
  }

  return res.json();
}

async function refreshToken() {
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    accessToken = data.token;
    return true;
  } catch {
    return false;
  }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path, body) => request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

export default api;
