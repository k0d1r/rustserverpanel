import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, AlertTriangle, Plus, Clock, Download, Archive, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { WipeSchedule } from '../types';
import Modal from '../components/Modal';

interface BackupItem {
  filename: string;
  sizeMb: string;
  createdAt: string;
}

const WipeScheduler = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [type, setType] = useState('Map Wipe');
  const [cronExpression, setCronExpression] = useState('0 14 * * 4');
  
  const [wipeModal, setWipeModal] = useState<{isOpen: boolean, type: string}>({isOpen: false, type: ''});
  const [isExecuting, setIsExecuting] = useState(false);

  const { data: schedules = [], refetch: refetchSchedules } = useQuery<WipeSchedule[]>({
    queryKey: ['wipeSchedules'],
    queryFn: async () => {
      const { data } = await client.get('/wipe/schedules');
      return data;
    },
    refetchInterval: 30000
  });

  const { data: backups = [], isLoading: isLoadingBackups } = useQuery<BackupItem[]>({
    queryKey: ['backups'],
    queryFn: async () => {
      const { data } = await client.get('/backups');
      return data;
    },
    refetchInterval: 30000
  });

  const [timeLeft, setTimeLeft] = useState<{ d: string, h: string, m: string, s: string } | null>(null);
  const [nextSchedule, setNextSchedule] = useState<WipeSchedule | null>(null);

  useEffect(() => {
    if (!schedules.length) {
      setTimeLeft(null);
      setNextSchedule(null);
      return;
    }

    const active = schedules.filter(s => s.active && s.nextRun).sort((a, b) => new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime());
    if (!active.length) {
      setTimeLeft(null);
      setNextSchedule(null);
      return;
    }

    const next = active[0];
    setNextSchedule(next);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(next.nextRun!).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' });
        refetchSchedules();
        return;
      }

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        d: d.toString().padStart(2, '0'),
        h: h.toString().padStart(2, '0'),
        m: m.toString().padStart(2, '0'),
        s: s.toString().padStart(2, '0')
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [schedules, refetchSchedules]);

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const backendType = type === 'Map Wipe' ? 'map' : type === 'Blueprint Wipe' ? 'bp' : type === 'Full Wipe' ? 'full' : 'backup';
      await client.post('/wipe/schedules', { type: backendType, cron_expression: cronExpression });
      refetchSchedules();
    } catch (e: any) {
      alert('Failed to add schedule: ' + (e.response?.data?.error || e.message));
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (confirm('Delete this schedule?')) {
      try {
        await client.delete(`/wipe/schedules/${id}`);
        refetchSchedules();
      } catch (e) {
        alert('Failed to delete schedule');
      }
    }
  };

  const handleExecuteWipe = async () => {
    setIsExecuting(true);
    try {
      const backendType = wipeModal.type === 'Map Wipe' ? 'map' : wipeModal.type === 'Blueprint Wipe' ? 'bp' : wipeModal.type === 'Full Wipe' ? 'full' : 'backup';
      await client.post('/wipe/execute', { type: backendType });
      
      if (backendType === 'backup') {
        queryClient.invalidateQueries({ queryKey: ['backups'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['wipeHistory'] });
      }
      
      setWipeModal({isOpen: false, type: ''});
    } catch (e: any) {
      alert('Failed to execute task: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (confirm('Are you sure you want to delete this backup?')) {
      try {
        await client.delete(`/backups/${filename}`);
        queryClient.invalidateQueries({ queryKey: ['backups'] });
      } catch (e) {
        alert('Failed to delete backup');
      }
    }
  };

  const handleDownloadBackup = (filename: string) => {
    // Navigate to download endpoint, since it relies on auth we assume they are logged in via cookies if setup,
    // but typically we'd fetch the blob and trigger download. Since we use JWT in header:
    client.get(`/backups/${filename}/download`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
      })
      .catch(() => alert('Failed to download backup'));
  };

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in relative pb-12">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">{t('tasks.title', 'Tasks & Backups')}</h1>
        <p className="text-text-secondary text-sm mt-1">{t('tasks.desc', 'Automate server wipes, restarts, and create manual/automatic backups.')}</p>
      </div>

      <div className="glass-panel p-8 flex flex-col items-center justify-center text-center border-primary/20 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden group">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <p className="text-text-secondary uppercase tracking-widest text-xs font-bold mb-2">{t('tasks.nextTask', 'Next Scheduled Task')}</p>
        <div className={`text-4xl md:text-6xl font-mono font-bold tracking-tight ${timeLeft ? 'text-text-primary drop-shadow-[0_0_15px_rgba(232,97,44,0.3)]' : 'text-text-muted'}`}>
          {timeLeft ? (
            <>
              {timeLeft.d}<span className="text-primary/70 mx-1">:</span>
              {timeLeft.h}<span className="text-primary/70 mx-1">:</span>
              {timeLeft.m}<span className="text-primary/70 mx-1">:</span>
              {timeLeft.s}
            </>
          ) : (
            <span>-- : -- : -- : --</span>
          )}
        </div>
        <div className="flex gap-4 md:gap-8 mt-2 text-text-muted text-xs md:text-sm font-medium">
          <span>{t('tasks.days', 'DAYS')}</span><span>{t('tasks.hours', 'HOURS')}</span><span>{t('tasks.minutes', 'MINUTES')}</span><span>{t('tasks.seconds', 'SECONDS')}</span>
        </div>
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 bg-bg-card/80 backdrop-blur border border-border rounded-full text-sm shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${nextSchedule ? (nextSchedule.type === 'backup' ? 'bg-blue-500 animate-pulse' : 'bg-primary animate-pulse') : 'bg-text-muted'}`}></span> 
          <span className="font-medium text-text-primary">
            {nextSchedule 
              ? (nextSchedule.type === 'map' ? 'Map Wipe' : nextSchedule.type === 'bp' ? 'BP Wipe' : nextSchedule.type === 'full' ? 'Full Wipe' : 'Server Backup') 
              : t('tasks.noSchedules', 'No Schedules Active')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col min-w-0">
          <div className="glass-panel flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-bg-surface flex items-center justify-between">
              <h2 className="font-semibold text-text-primary flex items-center gap-2"><Archive size={18} className="text-blue-400"/> {t('tasks.backups', 'Server Backups')}</h2>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[200px]">
              {isLoadingBackups ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted py-8">
                  <Loader size={24} className="animate-spin mb-2" />
                </div>
              ) : backups.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted py-8">
                  <Archive size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">{t('tasks.noBackups', 'No backups found')}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-bg-surface/50 text-text-secondary text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-medium">{t('tasks.filename', 'Filename')}</th>
                      <th className="py-3 px-4 font-medium">{t('tasks.size', 'Size')}</th>
                      <th className="py-3 px-4 font-medium">{t('tasks.createdAt', 'Created At')}</th>
                      <th className="py-3 px-4 font-medium text-right">{t('tasks.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {backups.map(backup => (
                      <tr key={backup.filename} className="hover:bg-bg-surface/30 transition-colors group">
                        <td className="py-3 px-4 text-text-primary font-medium">{backup.filename}</td>
                        <td className="py-3 px-4 text-text-secondary">{backup.sizeMb} MB</td>
                        <td className="py-3 px-4 text-text-secondary">{new Date(backup.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button onClick={() => handleDownloadBackup(backup.filename)} className="p-1.5 text-text-muted hover:text-blue-400 transition-colors" title="Download">
                            <Download size={16} />
                          </button>
                          <button onClick={() => handleDeleteBackup(backup.filename)} className="p-1.5 text-text-muted hover:text-error transition-colors" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="glass-panel overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border bg-bg-surface flex items-center justify-between">
              <h2 className="font-semibold text-text-primary flex items-center gap-2"><Clock size={18} className="text-primary"/> {t('tasks.schedules', 'Automated Schedules')}</h2>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[200px]">
              {schedules.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-text-muted py-8">
                  <Clock size={32} className="mb-2 opacity-20" />
                  <p className="text-sm">{t('tasks.noTaskSchedules', 'No task schedules configured')}</p>
                </div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-bg-surface/50 text-text-secondary text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-medium">{t('tasks.type', 'Type')}</th>
                      <th className="py-3 px-4 font-medium">{t('tasks.cron', 'Cron')}</th>
                      <th className="py-3 px-4 font-medium">{t('tasks.nextRun', 'Next Run')}</th>
                      <th className="py-3 px-4 font-medium text-right">{t('tasks.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {schedules.map(schedule => (
                      <tr key={schedule.id} className="hover:bg-bg-surface/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-text-primary flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${schedule.type === 'backup' ? 'bg-blue-400' : 'bg-primary'}`}></span>
                          {schedule.type.toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-secondary bg-bg-surface/50 rounded inline-block mt-1.5 mb-1.5">{(schedule as any).cron_expression || schedule.cronExpression}</td>
                        <td className="py-3 px-4 text-text-secondary">{new Date(schedule.nextRun).toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">
                          <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-1.5 text-text-muted hover:text-error transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6 min-w-0">
          <div className="glass-panel overflow-hidden">
            <div className="p-4 border-b border-border bg-bg-surface">
              <h2 className="font-semibold text-text-primary">{t('tasks.addSchedule', 'Add Schedule')}</h2>
            </div>
            <form className="p-4 space-y-4" onSubmit={handleAddSchedule}>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-text-secondary mb-1.5 uppercase">{t('tasks.taskType', 'Task Type')}</label>
                <select 
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="input-field appearance-none cursor-pointer"
                >
                  <option>Map Wipe</option>
                  <option>Blueprint Wipe</option>
                  <option>Full Wipe</option>
                  <option>Server Backup</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold tracking-wide text-text-secondary mb-1.5 uppercase">Cron Expression</label>
                <input 
                  type="text" 
                  value={cronExpression}
                  onChange={e => setCronExpression(e.target.value)}
                  className="input-field font-mono"
                  placeholder="0 14 * * 4"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" onClick={() => setCronExpression('0 14 * * 4')} className="text-[11px] px-2.5 py-1 bg-bg-surface border border-border rounded-md hover:border-primary transition-colors text-text-secondary hover:text-text-primary">Every Thurs 14:00</button>
                <button type="button" onClick={() => setCronExpression('0 0 * * *')} className="text-[11px] px-2.5 py-1 bg-bg-surface border border-border rounded-md hover:border-blue-400 transition-colors text-text-secondary hover:text-text-primary">Daily Midnight</button>
              </div>
              <div className="pt-2">
                <button type="submit" className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/30 hover:bg-primary hover:text-white text-primary font-medium rounded-lg transition-all">
                  <Plus size={16} /> Add Schedule
                </button>
              </div>
            </form>
          </div>

          <div className="glass-panel overflow-hidden border-warning/30 relative">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-warning/50"></div>
            <div className="p-4 border-b border-border bg-warning/5 flex items-center gap-2">
              <AlertTriangle className="text-warning" size={18} />
              <h2 className="font-semibold text-warning">Manual Actions</h2>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs text-text-secondary mb-4 leading-relaxed">Execute tasks immediately. Wipes cannot be undone and will restart the server. Backups run safely in the background.</p>
              <button onClick={() => setWipeModal({isOpen: true, type: 'Server Backup'})} className="w-full py-2.5 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500 hover:text-white text-blue-400 font-medium rounded-lg transition-all flex justify-center items-center gap-2">
                <Archive size={16}/> Execute Backup Now
              </button>
              <button onClick={() => setWipeModal({isOpen: true, type: 'Map Wipe'})} className="w-full py-2 bg-bg-surface border border-border hover:border-warning hover:text-warning rounded-lg text-sm transition-colors">
                Execute Map Wipe Now
              </button>
              <button onClick={() => setWipeModal({isOpen: true, type: 'Blueprint Wipe'})} className="w-full py-2 bg-bg-surface border border-border hover:border-warning hover:text-warning rounded-lg text-sm transition-colors">
                Execute BP Wipe Now
              </button>
              <button onClick={() => setWipeModal({isOpen: true, type: 'Full Wipe'})} className="w-full py-2 bg-error/10 text-error border border-error/30 hover:bg-error hover:text-white rounded-lg text-sm transition-colors mt-2">
                Execute Full Wipe Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={wipeModal.isOpen} onClose={() => !isExecuting && setWipeModal({isOpen: false, type: ''})} title={`Confirm ${wipeModal.type}`}>
        <div className="space-y-4">
          <div className={`p-4 border rounded-lg text-sm flex gap-3 items-start ${wipeModal.type === 'Server Backup' ? 'bg-blue-500/10 border-blue-500/30 text-blue-100' : 'bg-error/10 border-error/30 text-error'}`}>
            {wipeModal.type === 'Server Backup' ? <Archive size={20} className="shrink-0 mt-0.5 text-blue-400"/> : <AlertTriangle size={20} className="shrink-0 mt-0.5" />}
            <div>
              <p className="font-semibold mb-1">{wipeModal.type === 'Server Backup' ? 'Server Backup Process' : 'WARNING: Data Loss'}</p>
              {wipeModal.type === 'Server Backup' ? (
                <p>You are about to initiate a manual backup. This will securely archive your Oxide data and server identity files.</p>
              ) : (
                <>
                  <p>You are about to execute a {wipeModal.type}. This will delete server data permanently and restart the server immediately.</p>
                  {wipeModal.type === 'Full Wipe' && <p className="mt-2 font-bold">This will wipe BOTH the Map and Blueprints.</p>}
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button disabled={isExecuting} onClick={() => setWipeModal({isOpen: false, type: ''})} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-bg-surface border border-transparent disabled:opacity-50">Cancel</button>
            <button disabled={isExecuting} onClick={handleExecuteWipe} className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-70 ${wipeModal.type === 'Server Backup' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-error hover:bg-error/90'}`}>
              {isExecuting && <Loader size={16} className="animate-spin" />}
              {isExecuting ? 'Processing...' : 'Yes, Execute Now'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WipeScheduler;
