// API client helper for Autonomous E-Commerce Builder

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const BUILDER_API_BASE_URL = import.meta.env.VITE_BUILDER_API_URL || '/api/v1';

export const getToken = () => {
  return localStorage.getItem('forma_auth_token') || null;
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem('forma_auth_token', token);
  } else {
    localStorage.removeItem('forma_auth_token');
  }
};

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('forma_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setStoredUser = (user) => {
  if (user) {
    localStorage.setItem('forma_auth_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('forma_auth_user');
  }
};

export const clearAuth = () => {
  localStorage.removeItem('forma_auth_token');
  localStorage.removeItem('forma_auth_user');
};

export async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // If validation error with multiple issues
      if (data.errors && Array.isArray(data.errors)) {
        const errorMsg = data.errors.map((e) => e.message).join(', ');
        throw new Error(errorMsg || data.message || 'Validation error');
      }
      throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function builderRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${BUILDER_API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

async function builderDownload(endpoint, body, fallbackName) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BUILDER_API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error?.message || data.error || data.message || `Request failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

// ============================================
// BUILDER API
// ============================================

export async function getModuleCatalogue() {
  return builderRequest('/modules');
}

export async function resolveBlueprint(modules, options = {}) {
  return builderRequest('/builds/resolve', {
    method: 'POST',
    body: JSON.stringify({ modules, options }),
  });
}

export async function saveBuild(build) {
  return builderRequest('/builds', {
    method: 'POST',
    body: JSON.stringify(build),
  });
}

export async function getMyBuilds(params = {}) {
  const query = new URLSearchParams(params).toString();
  return builderRequest(`/builds/mine${query ? `?${query}` : ''}`);
}

export async function getBuildById(id) {
  return builderRequest(`/builds/${encodeURIComponent(id)}`);
}

export async function updateBuild(id, build) {
  return builderRequest(`/builds/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(build),
  });
}

export async function deleteBuild(id) {
  return builderRequest(`/builds/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function generateAndDownloadZip(blueprint) {
  const filename = `${(blueprint.storeName || 'generated-store').trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`;
  return builderDownload('/generate', blueprint, filename);
}

export async function getAdminBuilds(params = {}) {
  const query = new URLSearchParams(params).toString();
  return builderRequest(`/admin/builds${query ? `?${query}` : ''}`);
}

// ============================================
// AUTH API
// ============================================

export async function loginUser(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (res.token) {
    setToken(res.token);
  }
  if (res.user) {
    setStoredUser(res.user);
  }

  return res;
}

export async function registerUser(name, email, password, role = 'USER') {
  const res = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });

  if (res.token) {
    setToken(res.token);
  }
  if (res.user) {
    setStoredUser(res.user);
  }

  return res;
}

export async function getCurrentUser() {
  return await request('/auth/me');
}

// ============================================
// USERS API
// ============================================

export async function getAllUsers() {
  return await request('/users');
}

export async function getUserById(id) {
  return await request(`/users/${id}`);
}

export async function deleteUser(id) {
  return await request(`/users/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// PROJECTS API
// ============================================

export async function getProjects() {
  return await request('/projects');
}

export async function getProjectById(id) {
  return await request(`/projects/${id}`);
}

export async function createProject(projectData) {
  return await request('/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });
}

export async function deleteProject(id) {
  return await request(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// ============================================
// ADMIN API
// ============================================

export async function getAdminStats() {
  return await request('/admin/stats');
}

export async function getAdminUsers(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/users${query ? `?${query}` : ''}`);
}

export async function getAdminProjects(params = {}) {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/projects${query ? `?${query}` : ''}`);
}

export async function updateAdminUserRole(id, role) {
  return await request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function deleteAdminUser(id) {
  return await request(`/admin/users/${id}`, {
    method: 'DELETE',
  });
}
