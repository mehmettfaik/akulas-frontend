import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import axios from 'axios';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // localStorage'dan kullanıcıyı kontrol et
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);

    const handleUnauthorized = () => {
      setUser(null);
    };

    const handleForbidden = () => {
      // In a more complex app, you might set an error state here, but for now we just rely on ProtectedRoute logic 
      // or we could force a redirect by resetting state if we want, but usually forbidden just means access denied on an action.
      // If we wanted to forcefully send them to home on a page load forbidden, we could.
      // For now, removing user is not right for forbidden (403), because they are still logged in.
      // So we can just leave it to the alert/UI components or navigate them if we had access to router.
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    window.addEventListener('auth:forbidden', handleForbidden);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
      window.removeEventListener('auth:forbidden', handleForbidden);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Backend'e email ve password gönder
      const apiUrl = import.meta.env.VITE_API_URL || 'https://akulas-backend.onrender.com/api/v1';
      const response = await axios.post(`${apiUrl}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        // JWT token'ı kaydet
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        setUser(response.data.data.user);
      } else {
        throw new Error(response.data.message || 'Giriş yapılamadı');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.message || 'Giriş yapılamadı');
      }
      throw new Error(error instanceof Error ? error.message : 'Giriş yapılamadı');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
