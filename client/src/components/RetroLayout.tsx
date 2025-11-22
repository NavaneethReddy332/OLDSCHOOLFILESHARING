import React, { useEffect, useRef, useState } from 'react';
import { useTerminal } from '../context/TerminalContext';
import { CRTOverlay } from './CRTOverlay';
import { StatsPanel } from './StatsPanel';

interface RetroLayoutProps {
  children: React.ReactNode;
}

export function RetroLayout({ children }: RetroLayoutProps) {
  const { logs, addLog } = useTerminal();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [hackerMode, setHackerMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);

  // Boot sequence
  useEffect(() => {
    if (logs.length === 0) {
      const bootSequence = [
        { msg: "SYSTEM_INIT... OK", delay: 500 },
        { msg: "LOADING_MODEM_DRIVER... OK", delay: 1200 },
        { msg: "CONNECTING_TO_56K_GATEWAY... OK", delay: 2400 },
        { msg: "WAITING_FOR_INPUT...", delay: 3000 }
      ];

      bootSequence.forEach(({ msg, delay }) => {
        setTimeout(() => addLog(msg, 'system'), delay);
      });
    }
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  // Toggle Hacker Mode
  useEffect(() => {
    if (hackerMode) {
      document.body.classList.add('hacker-mode');
    } else {
      document.body.classList.remove('hacker-mode');
    }
  }, [hackerMode]);

  const handleLogoClick = () => {
    setLogoClicks(prev => prev + 1);
    if (logoClicks + 1 === 3) {
      // Easter Egg
      const audio = new Audio('https://www.dialupsound.com/audio/dialup.mp3'); // Just a placeholder, won't play without user interaction policy usually
      alert("EASTER EGG UNLOCKED: WELCOME TO RETROSEND BETA VERSION 0.9");
      addLog("EASTER_EGG_UNLOCKED: NETSCAPE_NAVIGATOR_MODE_ENABLED", "success");
      setLogoClicks(0);
    }
  };

  return (
    <div className={`min-h-screen p-2 w-full overflow-x-hidden ${hackerMode ? 'bg-black' : 'bg-[#c0c0c0]'}`}>
      <CRTOverlay />
      
      <table width="100%" border={0} cellPadding={5} style={{ tableLayout: "fixed" }}>
        <tbody>
          <tr>
            <td colSpan={3} align="center">
              <div className="overflow-hidden cursor-pointer select-none" onClick={handleLogoClick}>
                <pre className={`font-retro text-xs sm:text-sm md:text-base whitespace-pre font-bold leading-none mb-4 inline-block ${hackerMode ? 'text-green-500' : 'text-blue-900'}`}>
{`
 ____  _____ _____ ____  _____ ____  _____ _   _ ____  
|  _ \\| ____|_   _|  _ \\|  _  / ___|| ____| \\ | |  _ \\ 
| |_) |  _|   | | | |_) | | | \\___ \\|  _| |  \\| | | | |
|  _ <| |___  | | |  _ <| |_| |___) | |___| |\\  | |_| |
|_| \\_\\_____| |_| |_| \\_\\_____|____/|_____|_| \\_|____/ 
                                                       
`}
                </pre>
              </div>
              <div className={`${hackerMode ? 'bg-green-900 text-green-100 border-green-500' : 'bg-blue-900 text-white border-white'} p-1 mb-4 font-bold font-sans text-center marquee-container border-2 border-inset`}>
                 <div className="marquee-content">
                   WELCOME TO RETROSEND *** UPLOAD FILES FAST *** NO LOGS *** 100% FREE *** BEST VIEWED IN NETSCAPE NAVIGATOR 4.0
                 </div>
              </div>
            </td>
          </tr>
          
          <tr style={{ verticalAlign: "top" }}>
            {/* Sidebar */}
            <td width="160">
              <table width="100%" border={1} cellPadding={5} className={`${hackerMode ? 'bg-black border-green-500' : 'bg-gray-200 border-gray-400'}`}>
                <tbody>
                  <tr>
                    <td style={{ backgroundColor: hackerMode ? '#003300' : '#000080' }} className={`${hackerMode ? 'text-green-500' : 'text-white'} font-bold text-center font-sans text-sm`}>
                      MENU
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <ul className={`list-disc list-inside text-sm ${hackerMode ? 'text-green-500' : 'text-black'}`}>
                        <li><a href="/">Home</a></li>
                        <li><a href="/upload">Upload File</a></li>
                        <li><a href="/download">Download</a></li>
                        <li><a href="#">Guestbook</a></li>
                        <li><a href="#">Webring</a></li>
                        <li><a href="#">Email Us</a></li>
                      </ul>
                    </td>
                  </tr>
                  <tr>
                     <td align="center" className="pt-4">
                       <img src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExeDdlZHBzcmVwdmQzYjR6YjR6YjR6YjR6YjR6YjR6YjR6YjR6eSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Lp41w2lKxYfQs/giphy.gif" alt="Construction" width="50" />
                       <br />
                       <span className={`text-xs ${hackerMode ? 'text-green-500' : 'text-black'}`}>Under Construction</span>
                     </td>
                  </tr>
                </tbody>
              </table>

              <br />

              {/* Hacking Terminal Section */}
              <div 
                ref={terminalRef}
                className={`bg-black text-green-500 font-mono text-[10px] p-1 border-2 ${hackerMode ? 'border-green-500' : 'border-gray-600'} border-inset h-48 overflow-y-auto font-bold relative scrollbar-hide`}
              >
                <div className={`border-b ${hackerMode ? 'border-green-500' : 'border-green-900'} pb-1 mb-1 text-center bg-green-900/20 sticky top-0 backdrop-blur-sm`}>ROOT_ACCESS</div>
                <div className="opacity-90 leading-tight pb-6">
                  {logs.map((log) => (
                    <div key={log.id}>
                      <span className="text-green-300">root@retro:~#</span> {log.message}
                    </div>
                  ))}
                  <div className="mt-1">
                    <span className="text-green-300">root@retro:~#</span> <span className="animate-pulse">_</span>
                  </div>
                </div>
                <div className="fixed bottom-0 left-0 right-0 bg-green-900/10 p-1 text-center border-t border-green-900/30 pointer-events-none">
                   STATUS: ONLINE
                </div>
              </div>
              
              <br />

              <button 
                onClick={() => setHackerMode(!hackerMode)}
                className="retro-button w-full font-bold text-xs"
              >
                {hackerMode ? 'Disable Hacker Mode' : 'Enable Hacker Mode'}
              </button>
              
              <StatsPanel />
            </td>
            
            {/* Main Content */}
            <td>
              <div className={`${hackerMode ? 'bg-black border-green-500 text-green-500' : 'bg-white border-gray-400'} border-2 p-4 min-h-[400px]`}>
                {children}
              </div>
            </td>

            {/* Right Sidebar (Advert) */}
            <td width="140" className="hidden md:table-cell pl-2">
               <div className={`border-2 ${hackerMode ? 'border-green-500 bg-black' : 'border-gray-400 bg-gray-200'} p-2 text-center h-full`}>
                  <div className="mb-4">
                    <img src="https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif" alt="Ad" className="mx-auto border border-gray-500 w-full" />
                    <span className="text-[10px] block mt-1">Free 1000 Hours of AOL!</span>
                  </div>
                  
                  <div className="mb-4 retro-border p-1 bg-yellow-100">
                     <strong className="text-red-600 blink text-sm">HOT DEAL!!!</strong>
                     <p className="text-[10px] leading-tight mt-1 text-black">Get your own .COM domain for only $99.99/year!</p>
                  </div>

                  <div className="mb-4">
                    <img src="https://gifdb.com/images/high/animated-netscape-logo-j2z965l867302y1c.gif" alt="Netscape" className="mx-auto w-16" />
                    <span className="text-[10px] block mt-1">Best viewed with Netscape</span>
                  </div>
               </div>
            </td>
          </tr>
          
          <tr>
            <td colSpan={3} align="center" className="pt-4 text-xs font-mono">
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
