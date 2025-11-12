
import React, { createContext, useContext, useMemo } from 'react';

interface User {
  name: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Dummy user data for demonstration
const dummyUser: User = {
  name: 'Admin Pengadaan',
  roles: ['Admin', 'Approver'],
  permissions: [
    'pr.create',
    'pr.read',
    'pr.update',
    'pr.approve',
    'rfq.create',
    'rfq.read',
    'po.create',
    'po.read',
    'po.view', // for guard demonstration
  ],
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const user = dummyUser;

  const hasPermission = (permission: string): boolean => {
    return user?.permissions.includes(permission) ?? false;
  };

  const value = useMemo(() => ({ user, hasPermission }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
