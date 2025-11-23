import React, { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useTerminal } from '../context/TerminalContext';
import generatedVideo from '@assets/generated_videos/retro_90s_computer_interface_with_scrolling_code_and_glitch_effects.mp4';

interface RetroLayoutProps {
  children: React.ReactNode;
}

export function RetroLayout({ children }: RetroLayoutProps) {
  const { logs } = useTerminal();
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen p-2 sm:p-4 w-full bg-[#c0c0c0]">
      {/* Header */}
      <header className="mb-4">
        <div className="bg-[#000080] border-2 border-white p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between text-white font-bold shadow-md gap-3">
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-retro tracking-widest text-yellow-300">RETROSEND_V1.0</span>
          </div>
          
          <nav className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm font-sans justify-center">
            <Link href="/" className="text-white hover:text-yellow-300 no-underline hover:underline" data-testid="link-home">[ HOME ]</Link>
            <Link href="/upload" className="text-white hover:text-yellow-300 no-underline hover:underline" data-testid="link-upload">[ UPLOAD ]</Link>
            <Link href="/download" className="text-white hover:text-yellow-300 no-underline hover:underline" data-testid="link-download">[ DOWNLOAD ]</Link>
            <Link href="/guestbook" className="text-white hover:text-yellow-300 no-underline hover:underline" data-testid="link-guestbook">[ GUESTBOOK ]</Link>
          </nav>
        </div>
      </header>

      {/* Marquee Banner */}
      <div className="mb-4">
        <div className="bg-blue-900 text-white p-2 font-bold font-sans text-center marquee-container border-2 border-white text-xs sm:text-sm">
          <div className="marquee-content">
            WELCOME TO RETROSEND *** UPLOAD FILES FAST *** NO LOGS *** 100% FREE *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0
          </div>
        </div>
      </div>
      
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr] gap-4">
        {/* Main Content - appears first on mobile */}
        <main className="bg-white border-2 border-gray-400 p-4 sm:p-6 min-h-[400px] order-1 md:order-2">
          {children}
        </main>

        {/* Sidebar - appears second on mobile, first on desktop */}
        <aside className="space-y-4 order-2 md:order-1">
          {/* Video Feed */}
          <div className="border-2 border-gray-600 bg-black relative overflow-hidden h-[120px] sm:h-[140px]">
            <video 
              src={generatedVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] sm:text-xs text-green-500 text-center font-mono p-1">
              LIVE_FEED_CAM_01
            </div>
          </div>

          {/* Terminal Section */}
          <div 
            ref={terminalRef}
            className="bg-black text-green-500 font-mono text-[10px] sm:text-xs p-2 border-2 border-gray-600 h-64 sm:h-80 overflow-y-auto font-bold relative"
          >
            <div className="border-b border-green-900 pb-1 mb-2 text-center bg-green-900/20 sticky top-0 backdrop-blur-sm">
              ROOT_ACCESS
            </div>
            <div className="opacity-90 leading-tight space-y-0.5">
              {logs.map((log) => (
                <div key={log.id} className="break-all">
                  <span className="text-green-300">root@retro:~#</span> {log.message}
                </div>
              ))}
              <div className="mt-2">
                <span className="text-green-300">root@retro:~#</span> 
                <span className="animate-cursor inline-block w-2 h-3 bg-green-500 align-middle ml-1"></span>
              </div>
            </div>
          </div>
          
          {/* Visitor Counter */}
          <div className="text-center border-2 border-gray-400 p-2 bg-black text-green-500 font-retro text-xs sm:text-sm">
            VISITORS: 003482
          </div>
        </aside>
      </div>
      
      {/* Footer */}
      <footer className="mt-6 text-center text-xs sm:text-sm font-mono">
        <hr className="border-gray-500 mb-3" />
        <div>
          (c) 1998 RetroSend Inc. All rights reserved.<br />
          Made with Notepad.
        </div>
      </footer>
    </div>
  );
}
