import React, { createContext, useContext, useState, useCallback } from "react";

type LogType = "info" | "success" | "warning" | "error" | "system";

interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: LogType;
}

interface TerminalContextType {
  logs: LogEntry[];
  addLog: (message: string, type?: LogType) => void;
  clearLogs: () => void;
}

const TerminalContext = createContext<TerminalContextType | undefined>(undefined);

export function TerminalProvider({ children }: { children: React.ReactNode }) {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "init-1",
      timestamp: new Date().toLocaleTimeString(),
      message: "SYSTEM_INIT... OK",
      type: "system",
    },
    {
      id: "init-2",
      timestamp: new Date().toLocaleTimeString(),
      message: "MOUNTING_VIRTUAL_DRIVE... OK",
      type: "system",
    },
    {
      id: "init-3",
      timestamp: new Date().toLocaleTimeString(),
      message: "ESTABLISHING_SECURE_CONNECTION...",
      type: "system",
    },
  ]);

  const addLog = useCallback((message: string, type: LogType = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      },
    ]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <TerminalContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </TerminalContext.Provider>
  );
}

export function useTerminal() {
  const context = useContext(TerminalContext);
  if (context === undefined) {
    throw new Error("useTerminal must be used within a TerminalProvider");
  }
  return context;
}
