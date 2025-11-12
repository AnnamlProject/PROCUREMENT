import { PERMISSIONS, USER_PROFILES, UserProfile } from '@/lib/permissions';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  user: UserProfile | null;
  login: (role: keyof typeof USER_PROFILES) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  const login = (role: keyof typeof USER_PROFILES) => {
    const userProfile = USER_PROFILES[role];
    if (userProfile) {
      setUser(userProfile);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  }, [user]);

  const value = useMemo(() => ({ user, login, logout, hasPermission }), [user, hasPermission]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
