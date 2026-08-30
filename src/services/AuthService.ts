export const AuthService = {
  getToken: () => localStorage.getItem('admin_token'),
  setToken: (token: string) => localStorage.setItem('admin_token', token),
  clearToken: () => localStorage.removeItem('admin_token'),
  
  fetchWithAuth: async (url: string, options: RequestInit = {}) => {
    const token = AuthService.getToken();
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, { ...options, headers });
  },

  verify: async () => {
    const token = AuthService.getToken();
    if (!token) return null;
    
    try {
      const res = await fetch('/api/v1/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
      AuthService.clearToken();
      return null;
    } catch (err) {
      return null;
    }
  }
};
