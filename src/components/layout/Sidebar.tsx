
import { NavLink, useLocation } from 'react-router-dom';
import { SIDENAV_ITEMS } from '@/lib/constants';
import { ChevronDown, X } from 'lucide-react';
import { useState, useEffect, FC } from 'react';
import type { NavItem } from '@/lib/constants';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Sidebar = ({ sidebarOpen, setSidebarOpen }: SidebarProps) => {
  const location = useLocation();

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-card text-card-foreground transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-primary">ERP Procurement</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-1 text-card-foreground/70 hover:text-card-foreground"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-2">
            {SIDENAV_ITEMS.map((item, idx) => (
              <MenuItem key={idx} item={item} currentPath={location.pathname} />
            ))}
          </nav>
        </div>
      </aside>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
};

// FIX: Explicitly type MenuItem as a React.FC to resolve issues with the `key` prop being misidentified by TypeScript.
const MenuItem: FC<{ item: NavItem; currentPath: string }> = ({ item, currentPath }) => {
  const [isSubmenuOpen, setSubmenuOpen] = useState(
    item.submenu?.some(subItem => currentPath.startsWith(subItem.path)) ?? false
  );

  useEffect(() => {
    if (item.submenu?.some(subItem => currentPath.startsWith(subItem.path))) {
      setSubmenuOpen(true);
    }
  }, [currentPath, item.submenu]);

  if (item.submenu) {
    return (
      <div>
        <button
          onClick={() => setSubmenuOpen(!isSubmenuOpen)}
          className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span>{item.title}</span>
          </div>
          <ChevronDown
            size={16}
            className={`transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isSubmenuOpen && (
          <div className="mt-1 ml-4 space-y-1 border-l border-border pl-4">
            {item.submenu.map((subItem, subIdx) => (
              <MenuItem key={subIdx} item={subItem} currentPath={currentPath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors
        ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
        }`
      }
    >
      {item.icon}
      <span>{item.title}</span>
    </NavLink>
  );
};