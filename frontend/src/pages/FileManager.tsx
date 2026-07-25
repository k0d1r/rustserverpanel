import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import client from '../api/client';
import { Folder, File, FileCode, FileText, ChevronRight, CornerLeftUp, Trash2, Edit3, Plus, Save, X } from 'lucide-react';
import Editor from '@monaco-editor/react';

interface FSEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  mtime: string;
}

const FileManager = () => {
  const [currentPath, setCurrentPath] = useState('');
  const [editingFile, setEditingFile] = useState<{ name: string, path: string, content: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery<FSEntry[]>({
    queryKey: ['fs', currentPath],
    queryFn: async () => {
      const { data } = await client.get(`/fs/list?path=${encodeURIComponent(currentPath)}`);
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (targetPath: string) => {
      await client.post('/fs/delete', { path: targetPath });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fs', currentPath] })
  });

  const mkdirMutation = useMutation({
    mutationFn: async (dirPath: string) => {
      await client.post('/fs/mkdir', { path: dirPath });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fs', currentPath] })
  });

  const saveMutation = useMutation({
    mutationFn: async ({ path, content }: { path: string, content: string }) => {
      await client.post('/fs/write', { path, content });
    },
    onSuccess: () => setEditingFile(null)
  });

  const handleNavigate = (folderName: string) => {
    setCurrentPath(prev => prev ? `${prev}/${folderName}` : folderName);
  };

  const handleGoUp = () => {
    const parts = currentPath.split('/');
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const handleOpenFile = async (file: FSEntry) => {
    const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
    try {
      const { data } = await client.get(`/fs/read?path=${encodeURIComponent(filePath)}`);
      setEditingFile({ name: file.name, path: filePath, content: data.content });
    } catch (e) {
      alert('Could not open file');
    }
  };

  const handleCreateFolder = () => {
    const name = prompt('New folder name:');
    if (name) {
      const targetPath = currentPath ? `${currentPath}/${name}` : name;
      mkdirMutation.mutate(targetPath);
    }
  };

  const handleDelete = (file: FSEntry) => {
    if (confirm(`Are you sure you want to delete ${file.name}?`)) {
      const targetPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      deleteMutation.mutate(targetPath);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith('.json') || name.endsWith('.cs') || name.endsWith('.cfg')) return <FileCode size={18} className="text-primary" />;
    if (name.endsWith('.txt') || name.endsWith('.log')) return <FileText size={18} className="text-text-secondary" />;
    return <File size={18} className="text-text-muted" />;
  };

  const getLanguage = (name: string) => {
    if (name.endsWith('.json')) return 'json';
    if (name.endsWith('.cs')) return 'csharp';
    if (name.endsWith('.js')) return 'javascript';
    if (name.endsWith('.cfg') || name.endsWith('.txt') || name.endsWith('.log')) return 'plaintext';
    return 'plaintext';
  };

  if (editingFile) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col bg-bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-bg-base/50">
          <h2 className="font-medium text-text-primary flex items-center gap-2">
            {getFileIcon(editingFile.name)}
            {editingFile.name}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setEditingFile(null)}
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2"
            >
              <X size={16} /> Cancel
            </button>
            <button
              onClick={() => saveMutation.mutate({ path: editingFile.path, content: editingFile.content })}
              disabled={saveMutation.isPending}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language={getLanguage(editingFile.name)}
            theme="vs-dark"
            value={editingFile.content}
            onChange={(val) => setEditingFile(prev => prev ? { ...prev, content: val || '' } : null)}
            options={{ minimap: { enabled: false }, fontSize: 14 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">File Manager</h1>
          <p className="text-text-secondary text-sm mt-1">Manage server files, configs, and plugins directly.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreateFolder} className="btn-secondary flex items-center gap-2">
            <Plus size={16} /> New Folder
          </button>
        </div>
      </div>

      <div className="bg-bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border bg-bg-base/50 flex items-center gap-2 text-sm text-text-secondary font-medium">
          <span className="text-text-primary hover:text-primary cursor-pointer transition-colors" onClick={() => setCurrentPath('')}>
            /home/container
          </span>
          {currentPath.split('/').filter(Boolean).map((part, idx, arr) => (
            <React.Fragment key={idx}>
              <ChevronRight size={14} className="text-text-muted" />
              <span 
                className="text-text-primary hover:text-primary cursor-pointer transition-colors"
                onClick={() => setCurrentPath(arr.slice(0, idx + 1).join('/'))}
              >
                {part}
              </span>
            </React.Fragment>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-base/30">
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Name</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Size</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">Modified</th>
                <th className="py-3 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentPath && (
                <tr onClick={handleGoUp} className="hover:bg-bg-base/50 transition-colors cursor-pointer group">
                  <td colSpan={4} className="py-3 px-4 text-sm text-text-primary flex items-center gap-3">
                    <CornerLeftUp size={18} className="text-text-muted group-hover:text-primary transition-colors" />
                    ..
                  </td>
                </tr>
              )}
              
              {isLoading ? (
                <tr><td colSpan={4} className="py-8 text-center text-text-muted">Loading files...</td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={4} className="py-8 text-center text-text-muted">Empty directory</td></tr>
              ) : (
                files.map((file) => (
                  <tr key={file.name} className="hover:bg-bg-base/50 transition-colors group">
                    <td 
                      className="py-3 px-4 text-sm font-medium text-text-primary flex items-center gap-3 cursor-pointer"
                      onClick={() => file.isDirectory ? handleNavigate(file.name) : handleOpenFile(file)}
                    >
                      {file.isDirectory ? <Folder size={18} className="text-blue-400" /> : getFileIcon(file.name)}
                      <span className="group-hover:text-primary transition-colors">{file.name}</span>
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {file.isDirectory ? '-' : formatBytes(file.size)}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(file.mtime).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {!file.isDirectory && (
                        <button onClick={() => handleOpenFile(file)} className="p-1.5 text-text-muted hover:text-primary transition-colors" title="Edit">
                          <Edit3 size={16} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(file)} className="p-1.5 text-text-muted hover:text-error transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
