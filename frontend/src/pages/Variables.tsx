import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Save, CheckCircle, Server, Map, Settings as SettingsIcon, AlertCircle, Image as ImageIcon, Link as LinkIcon, Users, FileText } from 'lucide-react';

interface VariablesData {
  serverName: string;
  mapType: string;
  worldSize: number;
  seed: number;
  description: string;
  website: string;
  maxPlayers: number;
  serverImage: string;
  modded: boolean;
}

const Variables = () => {
  const queryClient = useQueryClient();
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: variables, isLoading } = useQuery<VariablesData>({
    queryKey: ['variables'],
    queryFn: async () => {
      const { data } = await client.get('/settings/variables');
      return data;
    }
  });

  const mutation = useMutation({
    mutationFn: async (newData: VariablesData) => {
      await client.post('/settings/variables', newData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variables'] });
      setSuccess(true);
      setErrorMsg('');
      setTimeout(() => setSuccess(false), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to save variables');
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const serverName = (formData.get('serverName') as string).trim();
    const mapType = (formData.get('mapType') as string).trim();
    const maxPlayers = Number(formData.get('maxPlayers'));

    // Explicit Frontend Validation
    if (!serverName) {
      setErrorMsg('Sunucu İsmi boş bırakılamaz!');
      return;
    }
    if (!mapType) {
      setErrorMsg('Harita Çeşidi boş bırakılamaz!');
      return;
    }
    if (!maxPlayers || maxPlayers <= 0) {
      setErrorMsg('Kişi Sayısı 0\'dan büyük olmalıdır!');
      return;
    }

    mutation.mutate({
      serverName,
      mapType,
      worldSize: Number(formData.get('worldSize')),
      seed: Number(formData.get('seed')),
      description: (formData.get('description') as string).trim(),
      website: (formData.get('website') as string).trim(),
      maxPlayers,
      serverImage: (formData.get('serverImage') as string).trim(),
      modded: formData.get('modded') === 'on'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse max-w-5xl">
        <div className="h-8 w-64 bg-bg-surface rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-bg-surface rounded-xl"></div>
          <div className="h-64 bg-bg-surface rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in relative pb-12">
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">Variables (Startup Settings)</h1>
        <p className="text-text-secondary text-sm mt-1">Configure your Rust server startup parameters and identity.</p>
      </div>

      {success && (
        <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in shadow-[0_0_15px_rgba(34,197,94,0.15)]">
          <CheckCircle size={20} className="shrink-0" />
          <span className="font-medium">Variables saved successfully. Restart the server to apply changes.</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg flex items-center gap-3 animate-fade-in shadow-[0_0_15px_rgba(239,68,68,0.15)]">
          <AlertCircle size={20} className="shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Server Identity Card */}
          <div className="glass-panel p-6 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-transparent"></div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Server className="text-primary" size={20} /> Server Identity
            </h2>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Sunucu İsmi *</label>
              <input
                type="text"
                name="serverName"
                defaultValue={variables?.serverName}
                className="input-field w-full group-hover:border-primary/30 focus:border-primary transition-colors"
                placeholder="[TR] My Rust Server"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2"><FileText size={14}/> Açıklama (Description)</label>
              <textarea
                name="description"
                defaultValue={variables?.description}
                className="input-field w-full min-h-[100px] resize-y group-hover:border-primary/30"
                placeholder="Sunucunuzun açıklaması. Yeni satır için \n kullanabilirsiniz."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2"><LinkIcon size={14}/> Websiteniz</label>
                <input
                  type="url"
                  name="website"
                  defaultValue={variables?.website}
                  className="input-field w-full group-hover:border-primary/30"
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2"><ImageIcon size={14}/> Banner URL</label>
                <input
                  type="url"
                  name="serverImage"
                  defaultValue={variables?.serverImage}
                  className="input-field w-full group-hover:border-primary/30"
                  placeholder="https://example.com/banner.jpg"
                />
              </div>
            </div>
          </div>

          {/* World & Network Card */}
          <div className="glass-panel p-6 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent"></div>
            <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
              <Map className="text-blue-400" size={20} /> World & Network
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Harita Çeşidi *</label>
                <input
                  type="text"
                  name="mapType"
                  defaultValue={variables?.mapType}
                  className="input-field w-full group-hover:border-blue-400/30 focus:border-blue-400"
                  placeholder="Procedural Map"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2"><Users size={14}/> Max Players *</label>
                <input
                  type="number"
                  name="maxPlayers"
                  defaultValue={variables?.maxPlayers}
                  className="input-field w-full group-hover:border-blue-400/30 focus:border-blue-400"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Dünya Boyutu (Size)</label>
                <input
                  type="number"
                  name="worldSize"
                  defaultValue={variables?.worldSize}
                  className="input-field w-full group-hover:border-blue-400/30 focus:border-blue-400"
                  placeholder="3500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Dünya No (Seed)</label>
                <input
                  type="number"
                  name="seed"
                  defaultValue={variables?.seed}
                  className="input-field w-full group-hover:border-blue-400/30 focus:border-blue-400"
                  placeholder="12345"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <SettingsIcon className="text-text-muted" size={16} /> Oxide Mod (Modded)
                  </label>
                  <p className="text-xs text-text-muted mt-1">Eklenti çalıştırmak için açık olmalı (Topluluk listesinden çıkarır).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer hover:scale-105 transition-transform">
                  <input type="checkbox" name="modded" defaultChecked={variables?.modded} className="sr-only peer" />
                  <div className="w-14 h-7 bg-bg-base peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:bg-white peer-checked:bg-primary shadow-inner"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end sticky bottom-6 z-10">
          <div className="glass-panel px-6 py-4 flex items-center justify-between w-full shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
            <span className="text-sm text-text-muted">Fill all required (*) fields to save</span>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2.5 bg-primary hover:bg-primary-light text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(232,97,44,0.4)] hover:shadow-[0_0_25px_rgba(232,97,44,0.6)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              <Save size={18} />
              {mutation.isPending ? 'Saving...' : 'Save Variables'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Variables;
