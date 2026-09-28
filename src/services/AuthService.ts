// Secure Client-Side Authentication Service
// Conforms to Zero-Trust architecture: no sensitive tokens stored in localStorage.
// All session state is managed via secure, HttpOnly, SameSite cookies with credentials: 'include'.

export const AuthService = {
  // Legacy stubs kept safe without persisting raw tokens in localStorage
  getToken: () => null,
  setToken: (_token: string) => {
    // Deliberately no-op: raw JWTs are never stored in localStorage
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('adminToken');
    } catch {}
  },
  clearToken: () => {
    try {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('adminToken');
    } catch {}
  },

  logout: async () => {
    try {
      AuthService.clearToken();
      await fetch('/api/v1/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      window.location.href = '/admin';
    }
  },

  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});
    // Credentials include automatically transmits the secure HttpOnly session cookie
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (res.status === 401) {
      AuthService.clearToken();
    }
    return res;
  },

  verify: async () => {
    try {
      const res = await fetch('/api/v1/auth/verify', {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      return null;
    } catch {
      return null;
    }
  },
};
