import React, { useEffect, useState } from 'react';

export function StatsPanel() {
  const [uptime, setUptime] = useState(0);
  const [visitors] = useState(3482);
  const [files] = useState(142);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptime(u => u + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="retro-border p-1 bg-[#c0c0c0] text-xs font-sans mt-4">
      <div className="retro-border-inset p-1 bg-[#c0c0c0] flex justify-between items-center px-2">
        <div className="flex gap-4">
          <span>Server Uptime: {formatTime(uptime)}</span>
          <span className="border-l border-gray-400 pl-4">Files Shared: {files}</span>
          <span className="border-l border-gray-400 pl-4">Memory: 64MB</span>
        </div>
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Online</span>
        </div>
      </div>
    </div>
  );
}
