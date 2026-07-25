import { Activity, Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useWebSocket } from '../hooks/useWebSocket';
import { formatUptime } from '../utils/format';
import { clsx } from 'clsx';

const ServerStatusBanner = () => {
  const { t } = useTranslation();
  const { serverInfo } = useWebSocket();

  if (!serverInfo) {
    return (
      <div className="h-16 border-b border-border bg-bg-surface flex items-center px-6 animate-pulse">
        <div className="w-48 h-5 bg-bg-card rounded"></div>
      </div>
    );
  }

  const isOnline = serverInfo.online;

  return (
    <div className="border-b border-border bg-bg-surface flex items-center justify-between px-6 py-3 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isOnline && (
              <span className="animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            )}
            <span className={clsx("relative inline-flex rounded-full h-3 w-3", isOnline ? "bg-success" : "bg-error")}></span>
          </span>
          <h2 className="font-semibold text-text-primary truncate max-w-[300px]" title={serverInfo.hostname}>
            {serverInfo.hostname || t('status.unknownServer', 'Unknown Server')}
          </h2>
        </div>
        
        <div className="h-4 w-px bg-border hidden sm:block"></div>
        
        <div className="hidden sm:flex items-center gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-text-muted" />
            <span>{serverInfo.players || 0}/{serverInfo.maxPlayers || 0} {t('status.players', 'Players')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={14} className="text-text-muted" />
            <span>{serverInfo.map || t('status.unknownMap', 'Unknown Map')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-text-muted" />
            <span>{formatUptime(serverInfo.uptime)}</span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-text-muted hidden md:block">
        {t('status.time', 'Time:')} {serverInfo.gameTime}
      </div>
    </div>
  );
};

export default ServerStatusBanner;
