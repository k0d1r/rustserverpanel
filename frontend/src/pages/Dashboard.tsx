import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Cpu, Clock, Box, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import client from '../api/client';
import { formatUptime, formatBytes } from '../utils/format';
import { ServerInfo } from '../types';

interface SystemInfo {
  cpu: number;
  memory: {
    total: number;
    used: number;
    percentage: number;
  };
}

const Dashboard = () => {
  const { t } = useTranslation();
  const [restartModal, setRestartModal] = useState(false);
  const [restartSeconds, setRestartSeconds] = useState(300);
  const [messageModal, setMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  
  const [historyData, setHistoryData] = useState<{time: string, fps: number, memory: number}[]>([]);

  const { data: serverInfo, isLoading } = useQuery<ServerInfo>({
    queryKey: ['serverInfo'],
    queryFn: async () => {
      const { data } = await client.get('/server/info');
      return data;
    },
    refetchInterval: 10000,
  });

  const { data: systemInfo } = useQuery<SystemInfo>({
    queryKey: ['systemInfo'],
    queryFn: async () => {
      const { data } = await client.get('/server/system');
      return data;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (serverInfo && serverInfo.online) {
      setHistoryData(prev => {
        const now = new Date().toLocaleTimeString();
        const newData = [...prev, { time: now, fps: serverInfo.fps || 0, memory: serverInfo.memory || 0 }];
        if (newData.length > 60) newData.shift();
        return newData;
      });
    }
  }, [serverInfo]);

  const handleRestart = async () => {
    try {
      await client.post('/server/restart', { seconds: restartSeconds });
      setRestartModal(false);
      alert('Restart initiated');
    } catch (e) {
      alert('Failed to restart');
    }
  };

  const handleSave = async () => {
    try {
      await client.post('/server/save');
      alert('World saved successfully');
    } catch (e) {
      alert('Failed to save world');
    }
  };

  const handleSay = async () => {
    try {
      await client.post('/server/say', { message });
      setMessageModal(false);
      setMessage('');
    } catch (e) {
      alert('Failed to send message');
    }
  };

  if (isLoading || !serverInfo) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-bg-card rounded-lg"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('dashboard.title', 'Dashboard')}</h1>
        
        <div className="flex gap-3">
          <button disabled={!serverInfo.online} onClick={() => setMessageModal(true)} className="px-4 py-2 bg-bg-surface border border-border hover:border-primary disabled:opacity-50 text-sm rounded-md transition-colors">
            {t('dashboard.broadcast', 'Broadcast')}
          </button>
          <button disabled={!serverInfo.online} onClick={handleSave} className="px-4 py-2 bg-bg-surface border border-border hover:border-primary disabled:opacity-50 text-sm rounded-md transition-colors">
            {t('dashboard.saveWorld', 'Save World')}
          </button>
          <button disabled={!serverInfo.online} onClick={() => setRestartModal(true)} className="px-4 py-2 bg-error/10 text-error border border-error/20 hover:bg-error/20 disabled:opacity-50 text-sm rounded-md transition-colors">
            {t('dashboard.restartServer', 'Restart Server')}
          </button>
        </div>
      </div>

      {!serverInfo.online && (
        <div className="p-4 bg-error/10 border border-error/20 text-error rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold">{t('dashboard.offlineTitle', 'Server is Offline or Disconnected')}</h3>
            <p className="text-sm opacity-90 mt-1">{t('dashboard.offlineDesc', 'Please ensure your Rust server is running and your RCON credentials in Settings are correct.')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-6">
        <StatCard title={t('dashboard.players', 'Players')} value={`${serverInfo.players || 0}/${serverInfo.maxPlayers || 0}`} icon={Users} color="text-primary bg-primary/10" />
        <StatCard title={t('dashboard.hostCpu', 'Host CPU')} value={`${systemInfo?.cpu.toFixed(1) || 0}%`} icon={Cpu} color={(systemInfo?.cpu || 0) > 80 ? "text-error bg-error/10" : "text-success bg-success/10"} />
        <StatCard title={t('dashboard.hostRam', 'Host RAM')} value={`${systemInfo?.memory.percentage.toFixed(1) || 0}%`} icon={Cpu} color={(systemInfo?.memory.percentage || 0) > 80 ? "text-warning bg-warning/10" : "text-success bg-success/10"} />
        <StatCard title={t('dashboard.gameFps', 'Game FPS')} value={serverInfo.fps || 0} icon={Activity} color={(serverInfo.fps || 0) < 30 ? "text-error bg-error/10" : "text-success bg-success/10"} />
        <StatCard title={t('dashboard.gameRam', 'Game RAM')} value={formatBytes((serverInfo.memory || 0) * 1024 * 1024, 0)} icon={Cpu} color="text-warning bg-warning/10" />
        <StatCard title={t('dashboard.uptime', 'Uptime')} value={formatUptime(serverInfo.uptime || 0)} icon={Clock} color="text-text-primary bg-bg-surface" />
        <StatCard title={t('dashboard.entities', 'Entities')} value={(serverInfo.entityCount || 0).toLocaleString()} icon={Box} color="text-text-primary bg-bg-surface" />
        <StatCard title={t('dashboard.queue', 'Queue')} value={serverInfo.queued || 0} icon={Users} color="text-text-primary bg-bg-surface" />
      </div>

      <div className="glass-panel p-6">
        <h3 className="text-lg font-medium mb-6">{t('dashboard.history', 'Performance History')}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--text-muted)" tick={{fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis yAxisId="left" stroke="var(--success)" tick={{fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--warning)" tick={{fill: 'var(--text-muted)'}} tickLine={false} axisLine={false} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border)', borderRadius: '8px' }}
                itemStyle={{ color: 'var(--text-primary)' }}
              />
              <Line yAxisId="left" type="monotone" dataKey="fps" stroke="var(--success)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="memory" stroke="var(--warning)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={restartModal} onClose={() => setRestartModal(false)} title={t('dashboard.restartTitle', 'Restart Server')}>
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            {t('dashboard.restartDesc', 'Are you sure you want to restart the server? This will kick all players and may take a few minutes.')}
          </p>
          <div>
            <label className="block text-sm text-text-secondary mb-1">{t('dashboard.countdown', 'Countdown (seconds)')}</label>
            <input 
              type="number" 
              value={restartSeconds} 
              onChange={(e) => setRestartSeconds(parseInt(e.target.value))}
              className="w-full bg-bg-base border border-border rounded px-3 py-2 focus:border-primary outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setRestartModal(false)} className="px-4 py-2 text-sm rounded hover:bg-bg-surface">{t('dashboard.cancel', 'Cancel')}</button>
            <button onClick={handleRestart} className="px-4 py-2 bg-error text-white text-sm rounded hover:bg-error/90">{t('dashboard.confirmRestart', 'Confirm Restart')}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={messageModal} onClose={() => setMessageModal(false)} title={t('dashboard.broadcastTitle', 'Broadcast Message')}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">{t('dashboard.message', 'Message')}</label>
            <input 
              type="text" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-bg-base border border-border rounded px-3 py-2 focus:border-primary outline-none"
              placeholder="Hello everyone!"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setMessageModal(false)} className="px-4 py-2 text-sm rounded hover:bg-bg-surface">{t('dashboard.cancel', 'Cancel')}</button>
            <button onClick={handleSay} className="px-4 py-2 bg-primary text-white text-sm rounded hover:bg-primary-light">{t('dashboard.send', 'Send')}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
