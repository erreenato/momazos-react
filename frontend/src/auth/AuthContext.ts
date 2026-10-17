import { createContext } from 'react';
import type { User } from '../types';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  /** true mientras se consulta /auth/me al cargar la app. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
