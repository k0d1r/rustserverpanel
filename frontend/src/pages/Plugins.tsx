import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, RefreshCw, Download, ExternalLink, Puzzle, Package, Clock, EyeOff, Shield, Upload } from 'lucide-react';
import client from '../api/client';
import { InstalledPlugin, UModPlugin } from '../types';

const CATEGORIES = ['All', 'Administration', 'Gameplay', 'Economy', 'Social', 'Security', 'Fun/Events', 'Utility', 'Developer'];

const CURATED_PLUGINS = [
  { name: 'Kits', title: 'Kit Eklentisi', description: 'Daha fazla bilgi için https://umod.org/plugins/Kits', author: 'Reneb', icon: Package, category: 'Eklentili' },
  { name: 'TimeOfDay', title: 'Gece Gündüz Süreleri', description: 'Sunucunuzun gece ve gündüz sürelerini ayarlamanıza yardımcı olur.', author: 'FuJiCuRa', icon: Clock, category: 'Eklentili' },
  { name: 'AdminRadar', title: 'Adminler İçin Esp', description: 'Adminlere ESP özelliği verir. Kötüye kullanımda sunucunuz banlanabilir!', author: 'nivex', icon: EyeOff, category: 'Topluluk' },
  { name: 'Vanish', title: 'Adminler İçin Görünmezlik', description: 'Adminlerin tamamen görünmez olmasına izin verir. Oyuncular sizi göremez.', author: 'Wulf', icon: Shield, category: 'Eklentili' },
];

const Plugins = () => {
  const [activeTab, setActiveTab] = useState<'curated' | 'installed' | 'store'>('curated');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);

  // Reset page when search or category changes
  useEffect(() => {
    setPage(1);
  }, [search, category]);

  const { data: installed = [], isLoading: isLoadingInstalled, refetch: refetchInstalled } = useQuery<InstalledPlugin[]>({
    queryKey: ['plugins', 'installed'],
    queryFn: async () => {
      const { data } = await client.get('/plugins/installed');
      return data;
    },
    enabled: activeTab === 'installed',
  });

  const { data: storeData, isLoading: isLoadingStore } = useQuery<{plugins: UModPlugin[], total: number, page: number, limit: number}>({
    queryKey: ['plugins', 'store', search, category, page],
    queryFn: async () => {
      const { data } = await client.get(`/plugins/store?search=${search}&category=${category === 'All' ? '' : category}&page=${page}`);
      return data;
    },
    enabled: activeTab === 'store',
  });

  const handleReload = async (name: string) => {
    try {
      await client.post('/plugins/reload', { name });
      alert(`Reloaded ${name}`);
      refetchInstalled();
    } catch (e) {
      alert(`Failed to reload ${name}`);
    }
  };

  const handleUnload = async (name: string) => {
    try {
      await client.post('/plugins/unload', { name });
      alert(`Unloaded ${name}`);
      refetchInstalled();
    } catch (e) {
      alert(`Failed to unload ${name}`);
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Are you sure you want to completely delete ${name}? This will remove the file from the server.`)) return;
    try {
      await client.delete(`/plugins/installed/${name}`);
      alert(`Deleted ${name}`);
      refetchInstalled();
    } catch (e: any) {
      alert(`Failed to delete ${name}: ${e.response?.data?.error || e.message}`);
    }
  };

  const handleInstall = async (slug: string, downloadUrl: string) => {
    try {
      if (!downloadUrl) {
        alert('Download URL not found for this plugin.');
        return;
      }
      await client.post('/plugins/install', { name: slug, download_url: downloadUrl });
      alert(`Successfully installed ${slug}!`);
      if (activeTab === 'installed') {
        refetchInstalled();
      }
    } catch (e: any) {
      alert(`Failed to install ${slug}: ${e.response?.data?.error || e.message}`);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.cs')) {
      alert('Only .cs files are supported for Oxide/Carbon plugins.');
      return;
    }

    try {
      const text = await file.text();
      await client.post('/plugins/upload', { filename: file.name, content: text });
      alert(`Successfully uploaded ${file.name}!`);
      if (activeTab === 'installed') {
        refetchInstalled();
      }
    } catch (err: any) {
      alert(`Failed to upload plugin: ${err.response?.data?.error || err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Plugins</h1>
        
        <div className="flex bg-bg-surface p-1 rounded-lg border border-border">
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'curated' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('curated')}
          >
            Önerilen Eklentiler
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'installed' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('installed')}
          >
            Installed
          </button>
          <button 
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'store' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
            onClick={() => setActiveTab('store')}
          >
            Plugin Store
          </button>
        </div>
        
        <div>
          <input 
            type="file" 
            accept=".cs" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-bg-surface border border-border hover:border-primary rounded-md text-sm transition-colors text-text-primary"
          >
            <Upload size={16} className="text-primary" />
            Upload Custom Plugin
          </button>
        </div>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden">
        {activeTab === 'curated' ? (
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Eklentili Category */}
              <div>
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Eklentili</h2>
                <div className="space-y-4">
                  {CURATED_PLUGINS.filter(p => p.category === 'Eklentili').map(plugin => {
                    const Icon = plugin.icon;
                    return (
                      <div key={plugin.name} className="bg-bg-surface border border-border rounded-lg p-4 hover:border-border-hover transition-colors flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-bg-base flex items-center justify-center shrink-0 border border-border">
                          <Icon size={24} className="text-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            {plugin.title} <span className="text-xs text-text-muted font-normal">{plugin.name}</span>
                          </h3>
                          <p className="text-xs text-text-secondary mt-1">{plugin.description}</p>
                        </div>
                        <button onClick={() => handleInstall(plugin.name, `https://umod.org/plugins/${plugin.name}.cs`)} className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success hover:bg-success/30 rounded-lg text-sm font-bold transition-colors shrink-0">
                          <Download size={16} /> INSTALL
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Topluluk Category */}
              <div>
                <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Topluluk</h2>
                <div className="space-y-4">
                  {CURATED_PLUGINS.filter(p => p.category === 'Topluluk').map(plugin => {
                    const Icon = plugin.icon;
                    return (
                      <div key={plugin.name} className="bg-bg-surface border border-border rounded-lg p-4 hover:border-border-hover transition-colors flex items-center gap-4">
                        <div className="w-12 h-12 rounded bg-bg-base flex items-center justify-center shrink-0 border border-border">
                          <Icon size={24} className="text-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            {plugin.title} <span className="text-xs text-text-muted font-normal">{plugin.name}</span>
                          </h3>
                          <p className="text-xs text-text-secondary mt-1">{plugin.description}</p>
                        </div>
                        <button onClick={() => handleInstall(plugin.name, `https://umod.org/plugins/${plugin.name}.cs`)} className="flex items-center gap-2 px-4 py-2 bg-success/20 text-success hover:bg-success/30 rounded-lg text-sm font-bold transition-colors shrink-0">
                          <Download size={16} /> INSTALL
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'installed' ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter plugins..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-colors"
                />
              </div>
              <button onClick={() => refetchInstalled()} className="p-2 text-text-muted hover:text-primary transition-colors">
                <RefreshCw size={18} className={isLoadingInstalled ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-bg-surface">
                  <tr>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">#</th>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Name</th>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Version</th>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Author</th>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase">Status</th>
                    <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {installed.filter(p => p.title.toLowerCase().includes(search.toLowerCase())).map((plugin, idx) => (
                    <tr key={plugin.title} className="hover:bg-bg-surface/50">
                      <td className="py-3 px-4 text-sm text-text-muted">{idx + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium text-text-primary">{plugin.title}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{plugin.version}</td>
                      <td className="py-3 px-4 text-sm text-text-secondary">{plugin.author}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full border border-success/20">Loaded</span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button onClick={() => handleReload(plugin.title)} className="px-3 py-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 rounded transition-colors">Reload</button>
                        <button onClick={() => handleUnload(plugin.title)} className="px-3 py-1.5 text-xs text-text-secondary border border-border hover:border-text-secondary rounded transition-colors">Unload</button>
                        <button onClick={() => handleDelete(plugin.title)} className="px-3 py-1.5 text-xs text-error border border-error/30 hover:bg-error/10 rounded transition-colors">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-border space-y-4 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input 
                  type="text" 
                  placeholder="Search uMod store..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-bg-base border border-border rounded-md pl-9 pr-4 py-2 text-sm focus:border-primary outline-none transition-colors"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 text-sm rounded-full transition-colors border ${category === cat ? 'bg-primary text-white border-primary' : 'bg-bg-surface text-text-secondary border-border hover:border-primary/50'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4">
              {isLoadingStore ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1,2,3,4,5,6].map(i => <div key={i} className="h-40 bg-bg-surface rounded-lg animate-pulse"></div>)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {storeData?.plugins.map(plugin => (
                    <div key={plugin.slug} className="bg-bg-surface border border-border rounded-lg p-4 hover:border-border-hover transition-colors flex flex-col">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-bg-base flex items-center justify-center shrink-0 border border-border overflow-hidden">
                          {plugin.icon_url ? <img src={plugin.icon_url} alt="" className="w-full h-full object-cover" /> : <Puzzle size={20} className="text-text-muted" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-text-primary truncate">{plugin.title}</h3>
                          <p className="text-xs text-text-secondary truncate">by {plugin.author}</p>
                        </div>
                      </div>
                      <p className="text-xs text-text-muted mt-3 line-clamp-2 h-8">{plugin.description}</p>
                      
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <span className="text-xs px-2 py-1 bg-bg-base rounded border border-border">{plugin.category}</span>
                        <div className="flex gap-2">
                          <a href={`https://umod.org/plugins/${plugin.slug}`} target="_blank" rel="noreferrer" className="p-1.5 text-text-muted hover:text-primary bg-bg-base rounded border border-border transition-colors">
                            <ExternalLink size={14} />
                          </a>
                          <button onClick={() => handleInstall(plugin.slug, plugin.download_url)} className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 rounded text-xs transition-colors">
                            <Download size={14} /> Install
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination Controls Fixed at Bottom */}
            {!isLoadingStore && storeData && storeData.plugins.length > 0 && (
              <div className="p-4 border-t border-border bg-bg-surface shrink-0 flex items-center justify-between">
                <div className="text-sm text-text-secondary">
                  Total {storeData.total} plugins found.
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-bg-base border border-border rounded text-sm hover:border-primary disabled:opacity-50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-text-primary px-2">Page {page}</span>
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * storeData.limit >= storeData.total}
                    className="px-3 py-1 bg-bg-base border border-border rounded text-sm hover:border-primary disabled:opacity-50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Plugins;
