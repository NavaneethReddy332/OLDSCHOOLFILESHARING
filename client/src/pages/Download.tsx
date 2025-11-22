import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";

export default function Download() {
  const [, params] = useRoute("/download/:code");
  const code = params?.code;
  const [, setLocation] = useLocation();
  const { addLog } = useTerminal();
  
  const [inputCode, setInputCode] = useState("");
  const [status, setStatus] = useState<'input' | 'searching' | 'found' | 'error'>('input');

  useEffect(() => {
    if (code) {
      setStatus('searching');
      addLog(`CONNECTING_TO_DB...`);
      addLog(`QUERY: SELECT * FROM FILES WHERE CODE='${code}'`);
      
      // Simulate searching
      setTimeout(() => {
        if (code === "999999") {
          setStatus('error'); // Simulating expired/not found
          addLog(`ERROR: FILE_NOT_FOUND_OR_EXPIRED`, 'error');
        } else {
          setStatus('found');
          addLog(`SUCCESS: FILE_LOCATED`);
          addLog(`DECRYPTING_METADATA... OK`);
        }
      }, 1500);
    } else {
      setStatus('input');
    }
  }, [code]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog(`USER_INPUT: ${inputCode}`);
    setLocation(`/download/${inputCode}`);
  };

  const handleDownload = () => {
    addLog(`INITIATING_DOWNLOAD_STREAM...`);
    addLog(`BUFFERING...`);
    alert("Starting download... (simulated)");
    setTimeout(() => {
        addLog(`DOWNLOAD_COMPLETE`);
    }, 1000);
  };

  return (
    <RetroLayout>
      <center>
        <h2>Download Center</h2>
      </center>

      {status === 'input' && (
         <center>
           <p>Please enter the 6-digit code to retrieve your file.</p>
           <form onSubmit={handleManualSubmit} className="bg-gray-200 p-8 border-2 border-white shadow-md inline-block">
             Code: <input 
               type="text" 
               value={inputCode}
               onChange={(e) => setInputCode(e.target.value)}
               className="retro-input" 
               size={10}
               maxLength={6}
             />
             <br /><br />
             <button type="submit" className="retro-button">Find File</button>
           </form>
         </center>
      )}

      {status === 'searching' && (
        <center>
          <p>Connecting to server...</p>
          <div className="w-64 h-4 border-2 border-gray-500 bg-white p-0.5 relative">
             <div className="h-full bg-blue-700 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
          </div>
          <p><small>Please wait...</small></p>
        </center>
      )}

      {status === 'found' && (
        <div className="border-2 border-blue-800 p-4 bg-[#eeeeff]">
          <table width="100%">
            <tbody>
              <tr>
                <td width="64">
                  <img src="https://win98icons.alexmeub.com/icons/png/file_lines-0.png" width="48" alt="File" />
                </td>
                <td>
                  <b>File Found!</b><br />
                  Filename: <code>mysterious_document.txt</code><br />
                  Size: 1.44 MB<br />
                  Expires: in 23 hours
                </td>
              </tr>
            </tbody>
          </table>
          
          <br />
          
          <center>
            <button onClick={handleDownload} className="retro-button font-bold text-lg py-2 px-8">
              DOWNLOAD NOW
            </button>
            <br /><br />
            <small>Checked by Norton AntiVirus</small>
          </center>
        </div>
      )}

      {status === 'error' && (
        <center>
          <img src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png" alt="Error" />
          <h3 className="text-red-600 mt-4">Error 404: File Not Found</h3>
          <p>The file you are looking for has expired or does not exist.</p>
          <br />
          <button onClick={() => setLocation("/")} className="retro-button">Back to Home</button>
        </center>
      )}
    </RetroLayout>
  );
}
