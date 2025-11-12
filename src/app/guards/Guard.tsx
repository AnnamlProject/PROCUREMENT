import React from 'react';
import { useAuth } from '../providers/AuthProvider';
import { checkPermissions } from '@/lib/permissions';

interface GuardProps {
  can?: string;
  any?: string[];
  all?: string[];
  children: React.ReactNode;
}

export const Guard: React.FC<GuardProps> = ({ can, any, all, children }) => {
  const { user } = useAuth();
  const userPermissions = user?.permissions ?? [];

  const isAllowed = checkPermissions(userPermissions, { can, any, all });

  if (!isAllowed) {
    return null;
  }

  return <>{children}</>;
};
