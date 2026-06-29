import { create } from 'zustand';

interface User {
  name: string;
  email: string;
  plan: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (_email: string, _password: string) => {
    set({
      user: { name: 'Andre Oliveira', email: 'andre@agencia.com.br', plan: 'Pro' },
      token: 'sv_mock_token_xyz',
      isAuthenticated: true,
    });
  },

  register: (name: string, email: string, _password: string) => {
    set({
      user: { name, email, plan: 'Pro' },
      token: 'sv_mock_token_xyz',
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
