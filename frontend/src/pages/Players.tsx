import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, UserX, MessageSquare, AlertTriangle, ShieldAlert } from 'lucide-react';
import client from '../api/client';
import { Player, Ban } from '../types';
import { formatUptime, formatPing } from '../utils/format';
import Modal from '../components/Modal';

const Players = () => {
  const [activeTab, setActiveTab] = useState<'online' | 'banned'>('online');
  const [search, setSearch] = useState('');
  
  const [actionModal, setActionModal] = useState<{type: 'kick' | 'ban' | 'message', player: Player | null}>({type: 'kick', player: null});
  const [reason, setReason] = useState('');

  const { data: players = [], isLoading: isLoadingPlayers, refetch: refetchPlayers } = useQuery<Player[]>({
    queryKey: ['players'],
    queryFn: async () => {
      const { data } = await client.get('/players');
      return data;
    },
    refetchInterval: 15000,
  });

  const { data: bans = [], isLoading: isLoadingBans, refetch: refetchBans } = useQuery<Ban[]>({
    queryKey: ['bans'],
    queryFn: async () => {
      const { data } = await client.get('/players/bans');
      return data;
    },
    enabled: activeTab === 'banned',
  });

  const handleAction = async () => {
    if (!actionModal.player) return;
    try {
      if (actionModal.type === 'message') {
        await client.post('/players/message', { steamId: actionModal.player.steamId, message: reason });
      } else {
        await client.post(`/players/${actionModal.type}`, { steamId: actionModal.player.steamId, reason });
      }
      setActionModal({type: 'kick', player: null});
      setReason('');
      if (actionModal.type === 'kick') refetchPlayers();
      if (actionModal.type === 'ban') { refetchPlayers(); refetchBans(); }
    } catch (e) {
      alert(`Failed to ${actionModal.type} player`);
    }
  };

  const handleUnban = async (steamId: string) => {
    if (confirm('Are you sure you want to unban this player?')) {
      try {
        await client.post('/players/unban', { steamId });
        refetchBans();
      } catch (e) {
        alert('Failed to unban player');
      }
    }
  };

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.steamId.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Players</h1>
        
        <div className="flex bg-bg-surface p-1 rounded-lg border border-border">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'online' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('online')}
          >
            Online Players ({players.length})
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'banned' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('banned')}
          >
            Ban List
          </button>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search name or Steam ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg-base border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-colors"
            />
          </div>
          <button 
            onClick={() => activeTab === 'online' ? refetchPlayers() : refetchBans()}
            className="p-2 text-text-muted hover:text-primary transition-colors rounded-md hover:bg-bg-surface border border-transparent hover:border-border"
          >
            <RefreshCw size={18} className={isLoadingPlayers || isLoadingBans ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-bg-surface sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">#</th>
                {activeTab === 'online' ? (
                  <>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Name</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Steam ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Ping</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Time Online</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Steam ID</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Reason</th>
                    <th className="py-3 px-6 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeTab === 'online' && filteredPlayers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-text-muted">
                    <UserX size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No players found</p>
                  </td>
                </tr>
              )}
              {activeTab === 'online' && filteredPlayers.map((player, idx) => (
                <tr key={player.steamId} className="hover:bg-bg-surface/50 transition-colors">
                  <td className="py-3 px-6 text-sm text-text-muted">{idx + 1}</td>
                  <td className="py-3 px-6 text-sm font-medium text-text-primary">{player.name}</td>
                  <td className="py-3 px-6 text-sm text-text-secondary font-mono">{player.steamId}</td>
                  <td className={`py-3 px-6 text-sm ${formatPing(player.ping)}`}>{player.ping}ms</td>
                  <td className="py-3 px-6 text-sm text-text-secondary">{formatUptime(player.connectedSeconds)}</td>
                  <td className="py-3 px-6 text-right space-x-2">
                    <button 
                      onClick={() => setActionModal({type: 'message', player})}
                      className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Message"
                    >
                      <MessageSquare size={16} />
                    </button>
                    <button 
                      onClick={() => setActionModal({type: 'kick', player})}
                      className="p-1.5 text-text-muted hover:text-warning transition-colors" title="Kick"
                    >
                      <AlertTriangle size={16} />
                    </button>
                    <button 
                      onClick={() => setActionModal({type: 'ban', player})}
                      className="p-1.5 text-text-muted hover:text-error transition-colors" title="Ban"
                    >
                      <UserX size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {activeTab === 'banned' && bans.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-text-muted">
                    <ShieldAlert size={48} className="mx-auto mb-3 opacity-20" />
                    <p>Ban list is empty</p>
                  </td>
                </tr>
              )}
              {activeTab === 'banned' && bans.map((ban, idx) => (
                <tr key={ban.steamId} className="hover:bg-bg-surface/50 transition-colors">
                  <td className="py-3 px-6 text-sm text-text-muted">{idx + 1}</td>
                  <td className="py-3 px-6 text-sm text-text-primary font-mono">{ban.steamId}</td>
                  <td className="py-3 px-6 text-sm text-text-secondary">{ban.reason}</td>
                  <td className="py-3 px-6 text-right">
                    <button 
                      onClick={() => handleUnban(ban.steamId)}
                      className="px-3 py-1.5 text-xs font-medium text-success border border-success/30 hover:bg-success/10 rounded transition-colors"
                    >
                      Unban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal 
        isOpen={!!actionModal.player} 
        onClose={() => setActionModal({type: 'kick', player: null})}
        title={`${actionModal.type === 'message' ? 'Send Message to' : actionModal.type === 'ban' ? 'Ban' : 'Kick'} ${actionModal.player?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">
              {actionModal.type === 'message' ? 'Message' : 'Reason (optional)'}
            </label>
            <input 
              type="text" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-bg-base border border-border rounded px-3 py-2 focus:border-primary outline-none"
              placeholder={actionModal.type === 'message' ? "Hello!" : "Breaking rules"}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setActionModal({type: 'kick', player: null})} className="px-4 py-2 text-sm rounded hover:bg-bg-surface">Cancel</button>
            <button onClick={handleAction} className={`px-4 py-2 text-white text-sm rounded ${actionModal.type === 'ban' ? 'bg-error hover:bg-error/90' : 'bg-primary hover:bg-primary-light'}`}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Players;
