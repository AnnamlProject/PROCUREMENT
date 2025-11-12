
import React from 'react';
import { useAuth } from '../providers/AuthProvider';

interface GuardProps {
  can: string;
  children: React.ReactNode;
}

export const Guard: React.FC<GuardProps> = ({ can, children }) => {
  const { hasPermission } = useAuth();

  if (!hasPermission(can)) {
    return null;
  }

  return <>{children}</>;
};
