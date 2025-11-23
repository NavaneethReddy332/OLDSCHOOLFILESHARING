import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useTerminal } from '../context/TerminalContext';
import generatedVideo from '@assets/generated_videos/retro_90s_computer_interface_with_scrolling_code_and_glitch_effects.mp4';

interface RetroLayoutProps {
  children: React.ReactNode;
}

export function RetroLayout({ children }: RetroLayoutProps) {
  const { logs } = useTerminal();
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen p-2 sm:p-4 w-full bg-[#c0c0c0]">
      {/* Header */}
      <header className="mb-4">
        <div className="bg-[#000080] border-2 border-white p-3 sm:p-4 flex items-center justify-between text-white font-bold shadow-md">
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-retro tracking-widest text-yellow-300">RETROSEND_V1.0</span>
          </div>
          
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-col gap-1 p-2 hover:bg-white/10 transition-colors rounded"
            aria-label="Toggle menu"
            data-testid="button-hamburger-menu"
          >
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? 'opacity-0' : ''
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-white transition-all duration-300 ${
                isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
              }`}
            ></span>
          </button>
        </div>
      </header>

      {/* Animated Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsMenuOpen(false)}
        data-testid="menu-overlay"
      >
        <nav
          className={`fixed top-0 right-0 h-full w-64 bg-[#000080] border-l-4 border-yellow-300 shadow-2xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-yellow-300 font-retro text-lg">MENU</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:text-yellow-300 text-2xl"
                data-testid="button-close-menu"
              >
                ×
              </button>
            </div>
            
            <Link
              href="/"
              className="text-white hover:text-yellow-300 no-underline hover:underline text-lg font-sans py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-home"
            >
              [ HOME ]
            </Link>
            <Link
              href="/upload"
              className="text-white hover:text-yellow-300 no-underline hover:underline text-lg font-sans py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-upload"
            >
              [ UPLOAD ]
            </Link>
            <Link
              href="/download"
              className="text-white hover:text-yellow-300 no-underline hover:underline text-lg font-sans py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-download"
            >
              [ DOWNLOAD ]
            </Link>
            <Link
              href="/guestbook"
              className="text-white hover:text-yellow-300 no-underline hover:underline text-lg font-sans py-2 transition-colors"
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-guestbook"
            >
              [ GUESTBOOK ]
            </Link>
          </div>
        </nav>
      </div>

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

          {/* Terminal Section with CRT Effects */}
          <div 
            className="relative bg-black border-2 border-gray-600 h-64 sm:h-80 overflow-hidden"
            style={{
              boxShadow: 'inset 0 0 40px rgba(0, 255, 0, 0.15), 0 0 20px rgba(0, 255, 0, 0.1)',
            }}
          >
            {/* CRT Scanlines Effect */}
            <div 
              className="absolute inset-0 pointer-events-none z-10"
              style={{
                background: 'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.15) 0px, rgba(0, 0, 0, 0.15) 1px, transparent 1px, transparent 2px)',
                animation: 'scanline 8s linear infinite',
              }}
            />
            
            {/* CRT Flicker Effect */}
            <div 
              className="absolute inset-0 pointer-events-none z-10 opacity-10"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                animation: 'flicker 0.15s infinite',
              }}
            />
            
            {/* Terminal Content */}
            <div 
              ref={terminalScrollRef}
              className="retro-terminal-scroll relative h-full overflow-y-auto p-3 font-mono text-[10px] sm:text-xs font-bold"
            >
              {/* Header Bar */}
              <div className="border-b border-green-900/50 pb-1 mb-2 text-center bg-green-900/10 sticky top-0 backdrop-blur-sm z-20">
                <span className="text-green-400 tracking-widest">
                  ◆ SYSTEM TERMINAL ◆
                </span>
              </div>
              
              {/* Log Lines */}
              <div className="space-y-1 leading-tight">
                {logs.map((log, index) => {
                  const getColorClass = () => {
                    switch (log.type) {
                      case 'error': return 'text-red-500';
                      case 'warning': return 'text-yellow-500';
                      case 'success': return 'text-cyan-400';
                      case 'system': return 'text-blue-400';
                      default: return 'text-green-400';
                    }
                  };
                  
                  const getPrefix = () => {
                    switch (log.type) {
                      case 'error': return '[ERR]';
                      case 'warning': return '[WRN]';
                      case 'success': return '[OK!]';
                      case 'system': return '[SYS]';
                      default: return '[>>>]';
                    }
                  };
                  
                  return (
                    <div 
                      key={log.id} 
                      className={`break-all ${getColorClass()} transition-all duration-300`}
                      style={{
                        textShadow: `0 0 5px currentColor`,
                        animation: log.isNew ? 'typeIn 0.3s ease-out' : 'none',
                      }}
                    >
                      <span className="text-green-600 text-[9px]">{log.timestamp}</span>
                      <span className="mx-1 font-bold">{getPrefix()}</span>
                      <span className="opacity-90">{log.message}</span>
                    </div>
                  );
                })}
                
                {/* Cursor Line */}
                <div className="mt-3 flex items-center">
                  <span className="text-green-400">root@retrosend</span>
                  <span className="text-green-600 mx-1">:</span>
                  <span className="text-cyan-400">~</span>
                  <span className="text-green-400 mx-1">$</span>
                  <span 
                    className="inline-block w-2 h-3 bg-green-500 align-middle animate-pulse"
                    style={{
                      boxShadow: '0 0 10px rgba(0, 255, 0, 0.8)',
                    }}
                  />
                </div>
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
