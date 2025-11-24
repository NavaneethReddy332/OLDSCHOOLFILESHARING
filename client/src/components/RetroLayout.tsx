import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { useTerminal } from '../context/TerminalContext';
import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import generatedVideo from '@assets/generated_videos/retro_90s_computer_interface_with_scrolling_code_and_glitch_effects.mp4';

interface RetroLayoutProps {
  children: React.ReactNode;
}

export function RetroLayout({ children }: RetroLayoutProps) {
  const { logs } = useTerminal();
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="min-h-screen p-2 sm:p-4 w-full" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Header */}
      <header className="mb-4">
        <div className="border-2 p-3 sm:p-4 flex items-center justify-between font-bold shadow-md transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)' }}>
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-retro tracking-widest transition-colors duration-300" style={{ color: 'var(--header-text)' }}>RETROSEND_V1.0</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="retro-button text-[10px] sm:text-xs px-2 sm:px-3 py-1 flex items-center gap-1 sm:gap-2"
              aria-label="Toggle theme"
              data-testid="button-theme-toggle"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <>
                  <span className="hidden sm:inline">DARK</span>
                  <Moon className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">LIGHT</span>
                  <Sun className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
            
            {/* Hamburger Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex flex-col gap-1 p-2 hover:bg-white/10 transition-colors rounded"
              aria-label="Toggle menu"
              data-testid="button-hamburger-menu"
            >
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
                style={{ backgroundColor: 'var(--header-text)' }}
              ></span>
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
                style={{ backgroundColor: 'var(--header-text)' }}
              ></span>
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
                style={{ backgroundColor: 'var(--header-text)' }}
              ></span>
            </button>
          </div>
        </div>
      </header>

      {/* Animated Menu Overlay */}
      <div
        className={`fixed inset-0 backdrop-blur-sm z-50 transition-all duration-300 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        style={{ backgroundColor: 'color-mix(in srgb, var(--terminal-bg) 80%, transparent)' }}
        onClick={() => setIsMenuOpen(false)}
        data-testid="menu-overlay"
      >
        <nav
          className={`fixed top-0 right-0 h-full w-64 border-l-4 shadow-2xl transform transition-all duration-300 ${
            isMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ 
            backgroundColor: 'var(--header-bg)',
            borderColor: 'var(--header-border)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 flex flex-col gap-4">
            <div className="flex justify-between items-center mb-4">
              <span className="font-retro text-lg transition-colors duration-300" style={{ color: 'var(--header-text)' }}>MENU</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-2xl transition-colors duration-300 hover:opacity-70"
                style={{ color: 'var(--header-text)' }}
                data-testid="button-close-menu"
              >
                ×
              </button>
            </div>
            
            <Link
              href="/"
              className="no-underline hover:underline text-lg font-sans py-2 transition-opacity duration-300 hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-home"
            >
              [ HOME ]
            </Link>
            <Link
              href="/upload"
              className="no-underline hover:underline text-lg font-sans py-2 transition-opacity duration-300 hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-upload"
            >
              [ UPLOAD ]
            </Link>
            <Link
              href="/download"
              className="no-underline hover:underline text-lg font-sans py-2 transition-opacity duration-300 hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
              onClick={() => setIsMenuOpen(false)}
              data-testid="link-download"
            >
              [ DOWNLOAD ]
            </Link>
            <Link
              href="/guestbook"
              className="no-underline hover:underline text-lg font-sans py-2 transition-opacity duration-300 hover:opacity-70"
              style={{ color: 'var(--header-text)' }}
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
        <div className="p-2 font-bold font-sans text-center marquee-container border-2 text-xs sm:text-sm transition-colors duration-300" style={{ backgroundColor: 'var(--header-bg)', borderColor: 'var(--header-border)', color: 'var(--header-text)' }}>
          <div className="marquee-content">
            WELCOME TO RETROSEND *** UPLOAD FILES FAST *** NO LOGS *** 100% FREE *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0
          </div>
        </div>
      </div>
      
      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[minmax(220px,280px)_1fr] gap-4">
        {/* Main Content - appears first on mobile */}
        <main className="border-2 p-4 sm:p-6 min-h-[400px] order-1 md:order-2 transition-colors duration-300" style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border-shadow)' }}>
          {children}
        </main>

        {/* Sidebar - appears second on mobile, first on desktop */}
        <aside className="space-y-4 order-2 md:order-1">
          {/* Video Feed */}
          <div className="border-2 relative overflow-hidden h-[120px] sm:h-[140px] transition-colors duration-300" style={{ borderColor: 'var(--border-shadow)', backgroundColor: 'var(--terminal-bg)' }}>
            <video 
              src={generatedVideo} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[10px] sm:text-xs text-center font-mono p-1" style={{ color: 'var(--terminal-text)' }}>
              LIVE_FEED_CAM_01
            </div>
          </div>

          {/* Terminal Section with CRT Effects */}
          <div 
            className="relative border-2 h-64 sm:h-80 overflow-hidden transition-colors duration-300"
            style={{
              backgroundColor: 'var(--terminal-bg)',
              borderColor: 'var(--border-shadow)',
              boxShadow: 'inset 0 0 40px color-mix(in srgb, var(--terminal-glow) 15%, transparent), 0 0 20px color-mix(in srgb, var(--terminal-glow) 10%, transparent)',
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
              <div className="border-b pb-1 mb-2 text-center sticky top-0 backdrop-blur-sm z-20" style={{ borderColor: 'color-mix(in srgb, var(--terminal-text) 30%, transparent)', backgroundColor: 'color-mix(in srgb, var(--terminal-text) 10%, transparent)' }}>
                <span className="tracking-widest" style={{ color: 'var(--terminal-text)' }}>
                  ◆ SYSTEM TERMINAL ◆
                </span>
              </div>
              
              {/* Log Lines */}
              <div className="space-y-1 leading-tight">
                {logs.map((log, index) => {
                  const getColorClass = () => {
                    switch (log.type) {
                      case 'error': return 'text-red-500 dark:text-red-400';
                      case 'warning': return 'text-yellow-500 dark:text-yellow-400';
                      case 'success': return 'text-cyan-400 dark:text-cyan-300';
                      case 'system': return 'text-blue-400 dark:text-blue-300';
                      default: return '';
                    }
                  };

                  const getInlineColor = () => {
                    if (log.type !== 'info' && log.type !== undefined) {
                      return undefined;
                    }
                    return { color: 'var(--terminal-text)' };
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
                        ...getInlineColor(),
                        textShadow: `0 0 5px currentColor`,
                        animation: log.isNew ? 'typeIn 0.3s ease-out' : 'none',
                      }}
                    >
                      <span className="text-[9px]" style={{ color: 'color-mix(in srgb, var(--terminal-text) 60%, transparent)' }}>{log.timestamp}</span>
                      <span className="mx-1 font-bold">{getPrefix()}</span>
                      <span className="opacity-90">{log.message}</span>
                    </div>
                  );
                })}
                
                {/* Cursor Line */}
                <div className="mt-3 flex items-center" style={{ color: 'var(--terminal-text)' }}>
                  <span>root@retrosend</span>
                  <span className="mx-1" style={{ color: 'color-mix(in srgb, var(--terminal-text) 60%, transparent)' }}>:</span>
                  <span className="text-cyan-400 dark:text-cyan-300">~</span>
                  <span className="mx-1">$</span>
                  <span 
                    className="inline-block w-2 h-3 align-middle animate-pulse"
                    style={{
                      backgroundColor: 'var(--terminal-text)',
                      boxShadow: '0 0 10px color-mix(in srgb, var(--terminal-glow) 80%, transparent)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Visitor Counter */}
          <div className="text-center border-2 p-2 font-retro text-xs sm:text-sm transition-colors duration-300" style={{ borderColor: 'var(--border-shadow)', backgroundColor: 'var(--terminal-bg)', color: 'var(--terminal-text)' }}>
            VISITORS: 003482
          </div>
        </aside>
      </div>
      
      {/* Footer */}
      <footer className="mt-6 text-center text-xs sm:text-sm font-mono transition-colors duration-300" style={{ color: 'var(--text-secondary)' }}>
        <hr className="mb-3" style={{ borderColor: 'var(--border-shadow)' }} />
        <div>
          (c) 1998 RetroSend Inc. All rights reserved.<br />
          Made with Notepad.
        </div>
      </footer>
    </div>
  );
}
