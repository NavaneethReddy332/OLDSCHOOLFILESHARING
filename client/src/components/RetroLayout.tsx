import React, { useEffect, useRef } from 'react';
import { useTerminal } from '../context/TerminalContext';

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
          <tr>
            <td colSpan={2} align="center">
              <div className="overflow-hidden">
                <pre className="font-retro text-xs sm:text-sm md:text-base whitespace-pre text-blue-900 font-bold leading-none mb-4 inline-block">
{`
 ____  _____ _____ ____  _____ ____  _____ _   _ ____  
|  _ \\| ____|_   _|  _ \\|  _  / ___|| ____| \\ | |  _ \\ 
| |_) |  _|   | | | |_) | | | \\___ \\|  _| |  \\| | | | |
|  _ <| |___  | | |  _ <| |_| |___) | |___| |\\  | |_| |
|_| \\_\\_____| |_| |_| \\_\\_____|____/|_____|_| \\_|____/ 
                                                       
`}
                </pre>
              </div>
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
              <table width="100%" border={1} cellPadding={5} className="bg-gray-200 border-gray-400">
                <tbody>
                  <tr>
                    <td style={{ backgroundColor: "#000080" }} className="text-white font-bold text-center font-sans text-sm">
                      MENU
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <ul className="list-disc list-inside text-sm">
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
                       <span className="text-xs">Under Construction</span>
                     </td>
                  </tr>
                </tbody>
              </table>

              <br />

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
                    <span className="text-green-300">root@retro:~#</span> <span className="animate-pulse">_</span>
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
