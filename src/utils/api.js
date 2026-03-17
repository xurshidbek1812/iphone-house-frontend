import { clearAuthData } from './authStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiFetch = async (url, options = {}) => {
  const token = sessionStorage.getItem('token');

  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers
  });

  let data = null;
  const contentType = response.headers.get('content-type') || '';

  if (response.status !== 204) {
    if (contentType.includes('application/json')) {
      data = await response.json().catch(() => null);
    } else {
      const text = await response.text().catch(() => '');
      data = text || null;
    }
  }

  if (response.status === 401) {
    clearAuthData();
    localStorage.clear();

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }

    throw new Error(
      (data && (data.error || data.message)) || 'Sessiya tugagan. Qayta kiring.'
    );
  }

  if (!response.ok) {
    throw new Error(
      (data && (data.error || data.message)) || 'API xatolik'
    );
  }

  return data;
};