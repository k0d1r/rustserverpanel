import { create } from 'zustand';

export interface LogEntry {
  id: string;
  message: string;
  logType: string;
  timestamp: string;
}

interface ConsoleState {
  logs: LogEntry[];
  addLog: (entry: LogEntry) => void;
  clearLogs: () => void;
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  logs: [],
  addLog: (entry) =>
    set((state) => {
      const newLogs = [...state.logs, entry];
      if (newLogs.length > 500) {
        newLogs.shift();
      }
      return { logs: newLogs };
    }),
  clearLogs: () => set({ logs: [] }),
}));
