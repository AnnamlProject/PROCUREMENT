import { useAuth } from '@/app/providers/AuthProvider';
import { USER_PROFILES } from '@/lib/permissions';
import { Menu, UserCircle, LogOut, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

interface TopbarProps {
  setSidebarOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setSidebarOpen }) => {
  const { user, login, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

      <div className="relative">
        {user ? (
          <div className="flex items-center gap-4">
             <div className="text-right">
              <div className="font-semibold text-foreground">{user.name}</div>
              <div className="text-xs text-muted-foreground">
                {user.roles.join(', ')}
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        ) : (
            <div>
                 <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)} 
                    onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
                >
                    Login Sebagai... <ChevronDown className="ml-2 h-4 w-4" />
                </button>
                {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                            {Object.keys(USER_PROFILES).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => {
                                        login(role as keyof typeof USER_PROFILES);
                                        setDropdownOpen(false);
                                    }}
                                    className="block w-full px-4 py-2 text-left text-sm text-popover-foreground hover:bg-accent"
                                >
                                    {USER_PROFILES[role as keyof typeof USER_PROFILES].name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </header>
  );
};
