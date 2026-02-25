const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('hb_token');
}

function setToken(token) {
  localStorage.setItem('hb_token', token);
}

function clearToken() {
  localStorage.removeItem('hb_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

const api = {
  getToken,
  setToken,
  clearToken,

  // Auth
  login: (researcherId, accessKey) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ researcherId, accessKey }) }),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
  getSession: () =>
    request('/auth/session'),

  // History
  getHistory: () => request('/files/history'),
  addHistory: (entry) =>
    request('/files/history', { method: 'POST', body: JSON.stringify(entry) }),
  deleteHistory: (id) =>
    request(`/files/history/${id}`, { method: 'DELETE' }),
  clearHistory: () =>
    request('/files/history', { method: 'DELETE' }),

  // Sharing
  getShared: () => request('/files/shared'),
  shareFile: (data) =>
    request('/files/share', { method: 'POST', body: JSON.stringify(data) }),
  revokeShare: (id) =>
    request(`/files/shared/${id}`, { method: 'DELETE' }),

  // Received
  getReceived: () => request('/files/received'),
  receiveFile: (data) =>
    request('/files/receive', { method: 'POST', body: JSON.stringify(data) }),
  markViewed: (id) =>
    request(`/files/received/${id}/view`, { method: 'PATCH' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (settings) =>
    request('/settings', { method: 'PUT', body: JSON.stringify(settings) }),
};

export default api;
