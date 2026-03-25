const API_BASE = '/api';

let authToken: string | null = localStorage.getItem('oscar_admin_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('oscar_admin_token', token);
  } else {
    localStorage.removeItem('oscar_admin_token');
  }
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

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }

  return data;
}

export const adminApi = {
  auth: {
    login: (email: string, password: string) =>
      request<{ success: boolean; data: { token: string; user: any } }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<{ success: boolean; data: any }>('/auth/me'),
  },

  plants: {
    list: () => request<{ success: boolean; data: any[] }>('/admin/plants'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/admin/plants', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/plants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  sections: {
    list: (plantId: string) =>
      request<{ success: boolean; data: any[] }>(`/admin/plants/${plantId}/sections`),
    create: (plantId: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/plants/${plantId}/sections`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/sections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    createItem: (sectionId: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/sections/${sectionId}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateItem: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  labFields: {
    list: (plantId: string) =>
      request<{ success: boolean; data: any[] }>(`/admin/plants/${plantId}/lab-fields`),
    create: (plantId: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/plants/${plantId}/lab-fields`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/lab-fields/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  thresholds: {
    list: (plantId: string) =>
      request<{ success: boolean; data: any[] }>(`/admin/plants/${plantId}/thresholds`),
    create: (plantId: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/plants/${plantId}/thresholds`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/thresholds/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  users: {
    list: () => request<{ success: boolean; data: any[] }>('/admin/users'),
    create: (data: any) =>
      request<{ success: boolean; data: any }>('/admin/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<{ success: boolean; data: any }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    assignPlant: (userId: string, plantId: string) =>
      request<{ success: boolean; data: any }>(`/admin/users/${userId}/assign-plant`, {
        method: 'POST',
        body: JSON.stringify({ plantId }),
      }),
  },

  history: {
    list: (plantId: string, page = 1) =>
      request<{ success: boolean; data: any }>(`/history?plantId=${plantId}&page=${page}`),
    get: (roundId: string) =>
      request<{ success: boolean; data: any }>(`/history/${roundId}`),
  },
};
