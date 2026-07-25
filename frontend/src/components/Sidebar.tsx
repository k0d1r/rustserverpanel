import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Terminal, Users, Puzzle, Calendar, Settings, Shield, LogOut, Folder, Sliders } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../hooks/useWebSocket';
import { clsx } from 'clsx';

const Sidebar = () => {
  const { t } = useTranslation();
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const { isConnected } = useWebSocket();

  const navItems = [
    { path: '/', label: t('sidebar.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { path: '/console', label: t('sidebar.console', 'Console'), icon: Terminal },
    { path: '/players', label: t('sidebar.players', 'Players'), icon: Users },
    { path: '/files', label: t('sidebar.files', 'Files'), icon: Folder },
    { path: '/plugins', label: t('sidebar.plugins', 'Plugins'), icon: Puzzle },
    { path: '/variables', label: t('sidebar.variables', 'Variables'), icon: Sliders },
    { path: '/tasks', label: t('sidebar.tasks', 'Tasks & Backups'), icon: Calendar },
    { path: '/settings', label: t('sidebar.settings', 'Settings'), icon: Settings },
  ];

  return (
    <div className="w-60 bg-bg-surface border-r border-border flex flex-col justify-between shrink-0 h-full">
      <div>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
            <Shield size={24} />
          </div>
          <h1 className="font-bold text-lg tracking-tight">RustServerPanel</h1>
        </div>

        <nav className="px-3 mt-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm font-medium',
                  isActive
                    ? 'bg-primary/10 text-primary border-l-2 border-primary'
                    : 'text-text-secondary hover:bg-bg-card hover:text-text-primary border-l-2 border-transparent'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              )}
              <span className={clsx("relative inline-flex rounded-full h-2.5 w-2.5", isConnected ? "bg-success" : "bg-error")}></span>
            </span>
            <span className="text-xs text-text-secondary">
              {isConnected ? t('sidebar.backendOnline', 'Backend Online') : t('sidebar.backendOffline', 'Backend Offline')}
            </span>
          </div>
        </div>
        
        <div className="bg-bg-card rounded-md p-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-text-primary truncate w-32">{user?.username}</span>
            <span className="text-xs text-text-muted capitalize">{user?.role}</span>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 text-text-muted hover:text-primary transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
