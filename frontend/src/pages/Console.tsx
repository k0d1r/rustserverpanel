import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { useTranslation } from 'react-i18next';
import 'xterm/css/xterm.css';
import { Trash2, Terminal as TerminalIcon, AlertTriangle } from 'lucide-react';
import { useConsoleStore } from '../store/consoleStore';
import { useWebSocket } from '../hooks/useWebSocket';

const Console = () => {
  const { t } = useTranslation();
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  
  const [command, setCommand] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const logs = useConsoleStore((state) => state.logs);
  const addLog = useConsoleStore((state) => state.addLog);
  const clearLogs = useConsoleStore((state) => state.clearLogs);
  const { isConnected, sendCommand } = useWebSocket();

  // Initialize terminal
  useEffect(() => {
    if (!termRef.current || xtermRef.current) return;

    const term = new Terminal({
      theme: {
        background: '#08080f',
        foreground: '#f1f5f9',
        cursor: '#e8612c',
        selectionBackground: 'rgba(232,97,44,0.3)',
      },
      fontFamily: "'Inter', 'JetBrains Mono', 'Fira Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      convertEol: true,
      disableStdin: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());
    
    term.open(termRef.current);
    fitAddon.fit();
    
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  // Write logs to terminal
  useEffect(() => {
    if (!xtermRef.current) return;
    const term = xtermRef.current;
    
    // Simple diffing logic to only write new logs
    // In a real scenario we'd just listen to new log events directly or track the last written index
    term.clear();
    logs.forEach(log => {
      let color = '\x1b[37m'; // White
      if (log.logType === 'Chat') color = '\x1b[36m';
      else if (log.logType === 'Error' || log.logType === 'Exception') color = '\x1b[31m';
      else if (log.logType === 'Warning') color = '\x1b[33m';
      else if (log.logType === 'Log') color = '\x1b[90m';
      
      term.writeln(`${color}${log.message}\x1b[0m`);
    });

    if (!isConnected) {
      term.writeln(`\x1b[31m[SYSTEM] RCON is currently disconnected. Waiting for connection...\x1b[0m`);
    }
    
    if (autoScroll) {
      term.scrollToBottom();
    }
  }, [logs, autoScroll, isConnected]);

  const handleSendCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || !isConnected) return;
    
    // Echo command locally
    addLog({
      id: Math.random().toString(36).substring(7),
      message: `> ${command}`,
      logType: 'Log',
      timestamp: new Date().toISOString()
    });

    sendCommand(command);
    setCommand('');
  };

  const handleClear = () => {
    clearLogs();
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <TerminalIcon className="text-primary" /> {t('console.title', 'RCON Console')}
        </h1>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded bg-bg-surface border-border text-primary focus:ring-primary"
            />
            {t('console.autoScroll', 'Auto-scroll')}
          </label>
          <button onClick={handleClear} className="p-2 hover:bg-bg-surface rounded-md text-text-secondary transition-colors" title={t('console.clearLogs', 'Clear Console')}>
              <Trash2 size={18} />
          </button>
          <div className={`px-2.5 py-1 text-xs rounded-full border ${isConnected ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'}`}>
            {isConnected ? t('console.connected', 'Connected') : t('console.disconnected', 'Disconnected')}
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#08080f] p-4 relative border border-border rounded-lg overflow-hidden flex flex-col min-h-0">
        {!isConnected && (
          <div className="absolute inset-0 bg-black/50 z-10 flex flex-col items-center justify-center pointer-events-none">
            <AlertTriangle className="text-warning mb-2" size={32} />
            <p className="text-white font-medium">{t('console.serverOffline', 'Server Offline')}</p>
            <p className="text-text-muted text-sm mt-1">{t('console.checkSettings', 'Please check your settings')}</p>
          </div>
        )}
        <div ref={termRef} className="w-full h-full" />
      </div>

      <div className="mt-4 p-2 border border-border bg-bg-surface rounded-lg">
        <form onSubmit={handleSendCommand} className="flex gap-2">
          <span className="text-primary font-mono py-2 pl-2">&gt;</span>
          <input 
            type="text" 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={isConnected ? t('console.placeholderConnected', "Enter RCON command...") : t('console.placeholderDisconnected', "Disconnected...")}
            disabled={!isConnected}
            className="flex-1 bg-transparent border-none outline-none font-mono text-sm text-text-primary px-2"
          />
          <button disabled={!isConnected || !command.trim()} type="submit" className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 text-sm font-medium rounded transition-colors">
            {t('console.send', 'Send')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Console;
