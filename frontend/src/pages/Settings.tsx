import { useState, useEffect } from 'react';
import { Save, Server, Shield, Eye, EyeOff, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { useAuthStore } from '../store/authStore';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const user = useAuthStore(state => state.user);
  
  const [rconHost, setRconHost] = useState('');
  const [rconPort, setRconPort] = useState('');
  const [rconPassword, setRconPassword] = useState('');
  const [rustServerDir, setRustServerDir] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await client.get('/settings/rcon');
        setRconHost(data.host || '');
        setRconPort(data.port ? data.port.toString() : '');
        setRustServerDir(data.dir || '');
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage(null);
    try {
      const { data } = await client.post('/settings/rcon/test', {
        host: rconHost,
        port: parseInt(rconPort),
        password: rconPassword
      });
      setMessage({ type: 'success', text: data.message || 'Connection successful!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.response?.data?.error || 'Connection failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveRcon = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await client.put('/settings/rcon', {
        host: rconHost,
        port: parseInt(rconPort),
        password: rconPassword,
        dir: rustServerDir
      });
      setMessage({ type: 'success', text: 'Settings saved successfully.' });
      setRconPassword(''); // clear password after save for security
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save RCON settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-64 bg-bg-card rounded-lg"></div>
    </div>;
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl pb-12">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('settings.title', 'Settings')}</h1>
        <p className="text-sm text-text-secondary mt-1">{t('settings.description', 'Manage your panel configuration and preferences.')}</p>
      </div>
      
      {message && (
        <div className={`px-4 py-3 rounded-md text-sm ${message.type === 'success' ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
          {message.text}
        </div>
      )}

      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-border bg-bg-surface flex items-center gap-3">
          <Globe className="text-primary" />
          <h2 className="text-lg font-medium text-text-primary">{t('settings.preferences', 'Panel Preferences')}</h2>
        </div>
        <div className="p-6">
          <label className="block text-sm font-medium text-text-secondary mb-2">{t('settings.language', 'Language')}</label>
          <select 
            value={i18n.language} 
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="w-full md:w-1/3 bg-bg-base border border-border rounded-md px-3 py-2 text-sm text-text-primary focus:border-primary outline-none transition-colors"
          >
            <option value="en">English (🇺🇸)</option>
            <option value="tr">Türkçe (🇹🇷)</option>
            <option value="zh">中文 (🇨🇳)</option>
            <option value="es">Español (🇪🇸)</option>
            <option value="ru">Русский (🇷🇺)</option>
            <option value="de">Deutsch (🇩🇪)</option>
          </select>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-border bg-bg-surface flex items-center gap-3">
          <Server className="text-primary" />
          <h2 className="text-lg font-medium text-text-primary">{t('settings.rconConnection', 'RCON Connection')}</h2>
        </div>
        
        <form onSubmit={handleSaveRcon} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.hostIp', 'Host / IP')}</label>
              <input 
                type="text" 
                value={rconHost}
                onChange={e => setRconHost(e.target.value)}
                placeholder="127.0.0.1"
                className="w-full bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.port', 'Port')}</label>
              <input 
                type="number" 
                value={rconPort}
                onChange={e => setRconPort(e.target.value)}
                placeholder="28016"
                className="w-full bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.serverPath', 'Rust Server Path')}</label>
              <input 
                type="text" 
                value={rustServerDir}
                onChange={e => setRustServerDir(e.target.value)}
                placeholder="C:\rustserver veya /home/rustserver"
                className="w-full bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors"
                required
              />
              <p className="text-xs text-text-muted mt-1">{t('settings.serverPathHelp', 'Full folder path of your server files')}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.password', 'Password')}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                value={rconPassword}
                onChange={e => setRconPassword(e.target.value)}
                placeholder={rconHost ? "••••••••" : "Enter RCON password"}
                className="w-full bg-bg-base border border-border rounded-md pl-3 pr-10 py-2 text-sm focus:border-primary outline-none transition-colors"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-xs text-text-muted mt-1">{t('settings.passwordHelp', 'Leave blank if you do not want to change it.')}</p>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-border">
            <button 
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !rconHost || !rconPort}
              className="px-4 py-2 bg-bg-surface border border-border hover:border-primary rounded-md text-sm transition-colors disabled:opacity-50"
            >
              {testing ? t('settings.testing', 'Testing...') : t('settings.testConnection', 'Test Connection')}
            </button>
            <button 
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary text-white hover:bg-primary-light rounded-md text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> {saving ? t('settings.saving', 'Saving...') : t('settings.saveSettings', 'Save Settings')}
            </button>
          </div>
        </form>
      </div>
      
      <div className="glass-panel overflow-hidden">
        <div className="p-6 border-b border-border bg-bg-surface flex items-center gap-3">
          <Shield className="text-primary" />
          <h2 className="text-lg font-medium text-text-primary">{t('settings.panelAccount', 'Panel Account')}</h2>
        </div>
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6 p-4 bg-bg-surface rounded-lg border border-border">
            <div className="w-12 h-12 bg-primary/20 text-primary rounded-full flex items-center justify-center text-xl font-bold">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-medium">{user?.username}</p>
              <p className="text-sm text-text-muted capitalize">{t('settings.role', 'Role:')} {user?.role}</p>
            </div>
          </div>
          
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.currentPassword', 'Current Password')}</label>
              <input type="password" placeholder="••••••••" className="w-full md:w-1/2 bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.newPassword', 'New Password')}</label>
              <input type="password" placeholder="••••••••" className="w-full md:w-1/2 bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">{t('settings.confirmPassword', 'Confirm New Password')}</label>
              <input type="password" placeholder="••••••••" className="w-full md:w-1/2 bg-bg-base border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none transition-colors" />
            </div>
            <div className="pt-2">
              <button className="px-4 py-2 bg-bg-surface border border-border hover:border-primary rounded-md text-sm transition-colors">
                {t('settings.updatePassword', 'Update Password')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
