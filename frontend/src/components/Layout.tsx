import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import ServerStatusBanner from './ServerStatusBanner';
import { useWebSocket } from '../hooks/useWebSocket';

const Layout = () => {
  const { t } = useTranslation();
  // Initialize websocket at the layout level
  useWebSocket();

  return (
    <div className="flex h-screen overflow-hidden bg-bg-base text-text-primary">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <ServerStatusBanner />
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>
          <footer className="mt-8 pt-4 border-t border-border/50 text-center text-xs text-text-muted flex justify-center items-center gap-1">
            {t('footer.createdBy', 'Created with ❤️ by')} 
            <a href="https://github.com/k0d1r" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light transition-colors font-medium">
              k0d1r
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
