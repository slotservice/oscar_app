// Cloud backend URL
const API_BASE = 'https://oscar-app-3qkb.onrender.com/api';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

// ─── Auth ─────────────────────────────────────────────────

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ success: boolean; data: any }>('/auth/me'),
  },

  // ─── Plants ───────────────────────────────────────────

  plants: {
    list: () => request<{ success: boolean; data: any[] }>('/plants'),
    get: (id: string) => request<{ success: boolean; data: any }>(`/plants/${id}`),
  },

  // ─── Rounds ───────────────────────────────────────────

  rounds: {
    create: (plantId: string) =>
      request<{ success: boolean; data: any }>('/rounds', {
        method: 'POST',
        body: JSON.stringify({ plantId }),
      }),
    get: (id: string) => request<{ success: boolean; data: any }>(`/rounds/${id}`),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/rounds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    summary: (id: string) => request<{ success: boolean; data: any }>(`/rounds/${id}/summary`),
  },

  // ─── Checklist ────────────────────────────────────────

  checklist: {
    get: (roundId: string) =>
      request<{ success: boolean; data: any[] }>(`/rounds/${roundId}/checklist`),
    save: (roundId: string, itemId: string, data: { status: string; note?: string; imageUrl?: string }) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/checklist/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ─── Labs ─────────────────────────────────────────────

  labs: {
    get: (roundId: string) =>
      request<{ success: boolean; data: any[] }>(`/rounds/${roundId}/labs`),
    save: (roundId: string, fieldId: string, value: number) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/labs/${fieldId}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
  },

  // ─── Observations ─────────────────────────────────────

  observations: {
    get: (roundId: string) =>
      request<{ success: boolean; data: { tags: any[]; entries: any[] } }>(`/rounds/${roundId}/observations`),
    add: (roundId: string, tagId: string, note?: string) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/observations`, {
        method: 'POST',
        body: JSON.stringify({ tagId, note }),
      }),
    remove: (roundId: string, id: string) =>
      request<{ success: boolean }>(`/rounds/${roundId}/observations/${id}`, {
        method: 'DELETE',
      }),
  },

  // ─── Suggestions ──────────────────────────────────────

  suggestions: {
    evaluate: (roundId: string) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/evaluate`, {
        method: 'POST',
      }),
    get: (roundId: string) =>
      request<{ success: boolean; data: any[] }>(`/rounds/${roundId}/suggestions`),
    acknowledge: (roundId: string, id: string) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/suggestions/${id}/ack`, {
        method: 'PUT',
      }),
  },

  // ─── Issues ───────────────────────────────────────────

  issues: {
    get: (roundId: string) =>
      request<{ success: boolean; data: any[] }>(`/rounds/${roundId}/issues`),
    create: (roundId: string, data: { description: string; actionTaken?: string; supervisorFlag?: boolean }) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/issues`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (roundId: string, id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/rounds/${roundId}/issues/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  // ─── History ──────────────────────────────────────────

  history: {
    list: (plantId: string, page = 1) =>
      request<{ success: boolean; data: { rounds: any[]; pagination: any } }>(`/history?plantId=${plantId}&page=${page}`),
    get: (roundId: string) =>
      request<{ success: boolean; data: any }>(`/history/${roundId}`),
  },
};
