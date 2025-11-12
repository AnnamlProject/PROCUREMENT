
import { useAuth } from '@/app/providers/AuthProvider';
import { Menu, UserCircle } from 'lucide-react';
import React from 'react';

interface TopbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b bg-card px-4 shadow-sm sm:px-6 lg:px-8">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-1 text-gray-500 md:hidden"
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Buka sidebar</span>
      </button>
      <div className="flex-1"></div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-semibold text-foreground">{user?.name}</div>
          <div className="text-xs text-muted-foreground">
            {user?.roles.join(', ')}
          </div>
        </div>
        <UserCircle className="h-8 w-8 text-gray-400" />
      </div>
    </header>
  );
};
