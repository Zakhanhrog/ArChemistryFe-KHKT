import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setUser: (userData) => {
        const user = {
          id: userData.id,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          avatarUrl: userData.avatarUrl
        };
        set({ user, token: userData.token, isAuthenticated: true });
        // Also store in localStorage for API interceptor
        if (userData.token) {
          localStorage.setItem('token', userData.token);
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null,
      })),
      
      // Initialize from localStorage on mount
      initAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          try {
            const user = JSON.parse(userStr);
            // Ensure avatarUrl is included
            if (!user.avatarUrl) {
              user.avatarUrl = null;
            }
            set({ user, token, isAuthenticated: true });
          } catch (e) {
            // Invalid data, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export default useAuthStore;
