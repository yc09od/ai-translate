// [69] API client with automatic token renewal (axios)
// Before each request: check if access token is about to expire, refresh if needed.
// On 401: attempt one refresh then retry. On refresh failure: logout.

import axios, { AxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const REFRESH_THRESHOLD_SECONDS = Number(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD_SECONDS ?? 300);

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // always send cookies (including HttpOnly refreshToken)
});

function getToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getTokenExpiry(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

export function isExpiringSoon(): boolean {
  const exp = getTokenExpiry();
  if (exp === null) return false;
  return exp - Math.floor(Date.now() / 1000) < REFRESH_THRESHOLD_SECONDS;
}

function logout(): void {
  document.cookie = 'token=; Max-Age=0; path=/';
  window.location.replace('/login');
}

export async function logoutUser(): Promise<void> {
  try {
    await client.post('/auth/logout');
  } catch {
    // ignore backend errors, still logout locally
  }
  document.cookie = 'token=; Max-Age=0; path=/';
  window.location.replace('/login');
}

export async function refreshAccessToken(): Promise<boolean> {
  try {
    await axios.post(`${API_URL}/auth/refresh`, null, { withCredentials: true });
    return true;
  } catch {
    logout();
    return false;
  }
}

// Request interceptor: inject Bearer token + pre-emptive refresh
client.interceptors.request.use(async (config) => {
  if (isExpiringSoon()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      // logout() already called; abort the request
      return Promise.reject(new axios.Cancel('Token expired, logged out'));
    }
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: on 401 attempt one refresh then retry
let isRefreshing = false;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest: AxiosRequestConfig & { _retry?: boolean } = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        logout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        const token = getToken();
        if (token && originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
        }
        return client(originalRequest);
      }
      // logout() already called inside refreshAccessToken
    }

    return Promise.reject(error);
  }
);

// [83] Get topics for current user
export async function getTopics(): Promise<{ id: string; title: string; sourceLang: string; targetLang: string; createdAt: string }[]> {
  const res = await client.get('/topics');
  return res.data;
}

// [84] Create a new topic
export async function createTopic(title: string): Promise<{ id: string; title: string }> {
  const res = await client.post('/topics', { title, sourceLang: 'en', targetLang: 'zh' });
  return res.data;
}

// [88] Delete a topic by id
export async function deleteTopic(id: string): Promise<void> {
  await client.delete(`/topics/${id}`);
}

// [99] Update topic title
export async function updateTopicTitle(id: string, title: string): Promise<void> {
  await client.patch(`/topics/${id}`, { title });
}

// [99] Reorder topics
export async function reorderTopics(items: { id: string; order: number }[]): Promise<void> {
  await client.put('/topics/reorder', items);
}

export default client;
