import type {
  AnalyticsSummary,
  DecisionDetail,
  DecisionListResponse,
  FollowUpResponse,
  PlanInfo,
  Preferences,
  SavedListResponse,
  SubscriptionInfo,
  TokenResponse,
  User,
} from '@/lib/api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api/v1';

const ACCESS_KEY = 'decisioniq.access';
const REFRESH_KEY = 'decisioniq.refresh';
const USER_KEY = 'decisioniq.user';

export class ApiError extends Error {
  status: number;
  requestId?: string;
  constructor(message: string, status: number, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
  }
}

function getToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

function setToken(key: string, value: string | null): void {
  if (typeof window === 'undefined') return;
  if (value === null) window.localStorage.removeItem(key);
  else window.localStorage.setItem(key, value);
}

async function parseError(res: Response): Promise<ApiError> {
  let detail = `Request failed (${res.status})`;
  try {
    const data = await res.json();
    if (typeof data.detail === 'string') detail = data.detail;
    else if (Array.isArray(data.detail)) {
      detail = data.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join('; ');
    }
    return new ApiError(detail, res.status, data.request_id);
  } catch {
    return new ApiError(detail, res.status);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getToken(REFRESH_KEY);
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data: TokenResponse = await res.json();
    setToken(ACCESS_KEY, data.access_token);
    setToken(REFRESH_KEY, data.refresh_token);
    setToken(USER_KEY, JSON.stringify(data.user));
    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
  retried = false,
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken(ACCESS_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(`Cannot reach the DecisionIQ backend (${BASE_URL}). Is it running?`, 0);
  }

  if (res.status === 401 && auth && !retried) {
    const ok = await (refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    }));
    if (ok) return request<T>(path, options, true);
    clearSession();
    throw new ApiError('Session expired — please log in again.', 401);
  }
  if (!res.ok) throw await parseError(res);

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------

export function getStoredUser(): User | null {
  const raw = getToken(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function hasSession(): boolean {
  return Boolean(getToken(ACCESS_KEY));
}

export function clearSession(): void {
  setToken(ACCESS_KEY, null);
  setToken(REFRESH_KEY, null);
  setToken(USER_KEY, null);
}

function persistSession(data: TokenResponse): void {
  setToken(ACCESS_KEY, data.access_token);
  setToken(REFRESH_KEY, data.refresh_token);
  setToken(USER_KEY, JSON.stringify(data.user));
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

export const api = {
  // auth
  async register(fullName: string, email: string, password: string): Promise<User> {
    const user = await request<User>('/auth/register', {
      method: 'POST',
      body: { full_name: fullName, email, password },
      auth: false,
    });
    // Auto-login for a smooth onboarding flow
    await this.login(email, password);
    return user;
  },

  async login(email: string, password: string): Promise<User> {
    const data = await request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    persistSession(data);
    return data.user;
  },

  async me(): Promise<User> {
    return request<User>('/auth/me');
  },

  logout(): void {
    clearSession();
  },

  // users
  async updateMe(payload: { full_name?: string }): Promise<User> {
    const user = await request<User>('/users/me', { method: 'PATCH', body: payload });
    setToken(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getPreferences(): Promise<Preferences> {
    return request<Preferences>('/users/preferences');
  },

  async updatePreferences(payload: Partial<Preferences>): Promise<Preferences> {
    return request<Preferences>('/users/preferences', { method: 'PATCH', body: payload });
  },

  // decisions
  async createDecision(payload: {
    raw_prompt: string;
    domain?: string;
    answers?: Record<string, unknown>;
    research_depth?: string;
  }): Promise<DecisionDetail> {
    return request<DecisionDetail>('/decisions', { method: 'POST', body: payload });
  },

  async getDecision(id: string): Promise<DecisionDetail> {
    return request<DecisionDetail>(`/decisions/${id}`);
  },

  async listDecisions(limit = 50, offset = 0): Promise<DecisionListResponse> {
    return request<DecisionListResponse>(`/decisions?limit=${limit}&offset=${offset}`);
  },

  async submitAnswers(id: string, answers: Record<string, unknown>): Promise<DecisionDetail> {
    return request<DecisionDetail>(`/decisions/${id}/answers`, { method: 'POST', body: { answers } });
  },

  async analyze(id: string): Promise<DecisionDetail> {
    return request<DecisionDetail>(`/decisions/${id}/analyze`, { method: 'POST' });
  },

  async followUp(id: string, message: string): Promise<FollowUpResponse> {
    return request<FollowUpResponse>(`/decisions/${id}/follow-up`, {
      method: 'POST',
      body: { message },
    });
  },

  async reweightDecision(id: string, criteria_weights: Record<string, number>): Promise<DecisionDetail> {
    return request<DecisionDetail>(`/decisions/${id}/reweight`, {
      method: 'POST',
      body: { criteria_weights },
    });
  },

  async saveDecision(id: string): Promise<void> {
    await request(`/decisions/${id}/save`, { method: 'POST' });
  },

  async unsaveDecision(id: string): Promise<void> {
    await request(`/decisions/${id}/save`, { method: 'DELETE' });
  },

  async deleteDecision(id: string): Promise<void> {
    await request(`/decisions/${id}`, { method: 'DELETE' });
  },

  async listSaved(): Promise<SavedListResponse> {
    return request<SavedListResponse>('/saved');
  },

  // analytics
  async analyticsSummary(): Promise<AnalyticsSummary> {
    return request<AnalyticsSummary>('/analytics/summary');
  },

  // subscriptions
  async getPlans(): Promise<Record<string, PlanInfo>> {
    return request<Record<string, PlanInfo>>('/subscriptions/plans');
  },

  async getSubscription(): Promise<SubscriptionInfo> {
    return request<SubscriptionInfo>('/subscriptions/me');
  },

  async upgradePlan(plan: string): Promise<{ plan: string; limits: PlanInfo }> {
    return request('/subscriptions/upgrade', { method: 'POST', body: { plan } });
  },

  // misc — /health lives at the server root, not under /api/v1
  async health(): Promise<{ status: string; missing_keys: string[] }> {
    const res = await fetch(`${BASE_URL.replace(/\/api\/v1\/?$/, '')}/health`);
    if (!res.ok) throw new ApiError('Backend unhealthy', res.status);
    return res.json();
  },
};

export default api;