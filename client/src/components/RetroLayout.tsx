import React, { useEffect, useRef } from 'react';
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
    <div className="min-h-screen p-2 w-full bg-[#c0c0c0] overflow-x-hidden">
      <table width="100%" border={0} cellPadding={5} style={{ tableLayout: "fixed" }}>
        <tbody>
          {/* Floating Header with Menu */}
          <tr>
            <td colSpan={2} align="center" className="pb-4">
              <div className="bg-[#000080] border-2 border-white border-outset p-2 flex items-center justify-between text-white font-bold shadow-md">
                <div className="flex items-center gap-4">
                   <span className="text-xl font-retro tracking-widest text-yellow-300">RETROSEND_V1.0</span>
                </div>
                
                <div className="flex gap-4 text-sm font-sans">
                   <a href="/" className="text-white hover:text-yellow-300 no-underline hover:underline">[ HOME ]</a>
                   <a href="/upload" className="text-white hover:text-yellow-300 no-underline hover:underline">[ UPLOAD ]</a>
                   <a href="/download" className="text-white hover:text-yellow-300 no-underline hover:underline">[ DOWNLOAD ]</a>
                   <a href="#" className="text-white hover:text-yellow-300 no-underline hover:underline">[ GUESTBOOK ]</a>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td colSpan={2} align="center">
              <div className="bg-blue-900 text-white p-1 mb-4 font-bold font-sans text-center marquee-container border-2 border-white border-inset">
                 <div className="marquee-content">
                   WELCOME TO RETROSEND *** UPLOAD FILES FAST *** NO LOGS *** 100% FREE *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0
                 </div>
              </div>
            </td>
          </tr>
          
          <tr style={{ verticalAlign: "top" }}>
            {/* Sidebar */}
            <td width="140">
              {/* Replaced Menu with Video */}
              <div className="border-2 border-gray-600 border-inset bg-black mb-4 relative overflow-hidden h-[105px]">
                <video 
                  src={generatedVideo} 
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[9px] text-green-500 text-center font-mono p-0.5">
                  LIVE_FEED_CAM_01
                </div>
              </div>

              {/* Hacking Terminal Section */}
              <div 
                ref={terminalRef}
                className="bg-black text-green-500 font-mono text-[10px] p-1 border-2 border-gray-600 border-inset h-48 overflow-y-auto font-bold relative scrollbar-hide"
              >
                <div className="border-b border-green-900 pb-1 mb-1 text-center bg-green-900/20 sticky top-0 backdrop-blur-sm">ROOT_ACCESS</div>
                <div className="opacity-90 leading-tight pb-6">
                  {logs.map((log) => (
                    <div key={log.id}>
                      <span className="text-green-300">root@retro:~#</span> {log.message}
                    </div>
                  ))}
                  <div className="mt-1">
                    <span className="text-green-300">root@retro:~#</span> <span className="animate-pulse inline-block w-2 h-3 bg-green-500 align-middle ml-1"></span>
                  </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-green-900/10 p-1 text-center border-t border-green-900/30 pointer-events-none">
                   STATUS: ONLINE
                </div>
              </div>
              
              <br />
              
              <div className="text-center border-2 border-gray-400 p-1 bg-black text-green-500 font-retro">
                VISITORS: 003482
              </div>
            </td>
            
            {/* Main Content */}
            <td>
              <div className="bg-white border-2 border-gray-400 p-4 min-h-[400px]">
                {children}
              </div>
            </td>
          </tr>
          
          <tr>
            <td colSpan={2} align="center" className="pt-4 text-xs font-mono">
              <hr className="border-gray-500 mb-2" />
              (c) 1998 RetroSend Inc. All rights reserved.<br />
              Made with Notepad.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
