// API client helper for Autonomous E-Commerce Builder

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
