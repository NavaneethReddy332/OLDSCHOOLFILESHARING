import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useQuery } from "@tanstack/react-query";

interface FileInfo {
  code: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  expiresAt: string;
}

export default function Download() {
  const [, params] = useRoute("/download/:code");
  const code = params?.code;
  const [, setLocation] = useLocation();
  const { addLog } = useTerminal();
  
  const [inputCode, setInputCode] = useState("");

  const { data: fileInfo, isLoading, isError } = useQuery<FileInfo>({
    queryKey: ['/api/file', code],
    enabled: !!code,
  });

  const status = !code ? 'input' : isLoading ? 'searching' : isError ? 'error' : 'found';

  useEffect(() => {
    if (code) {
      addLog(`CONNECTING_TO_DB...`);
      addLog(`QUERY: SELECT * FROM FILES WHERE CODE='${code}'`);
    }
  }, [code, addLog]);

  useEffect(() => {
    if (fileInfo) {
      addLog(`SUCCESS: FILE_LOCATED`);
      addLog(`DECRYPTING_METADATA... OK`);
    } else if (isError && code) {
      addLog(`ERROR: FILE_NOT_FOUND_OR_EXPIRED`, 'error');
    }
  }, [fileInfo, isError, code, addLog]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLog(`USER_INPUT: ${inputCode}`);
    setLocation(`/download/${inputCode}`);
  };

  const handleDownload = () => {
    if (!code) return;
    addLog(`INITIATING_DOWNLOAD_STREAM...`);
    addLog(`BUFFERING...`);
    
    window.location.href = `/api/download/${code}`;
    
    setTimeout(() => {
      addLog(`DOWNLOAD_COMPLETE`);
    }, 1000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return hours > 0 ? `in ${hours} hours` : 'soon';
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
               data-testid="input-download-code"
             />
             <br /><br />
             <button type="submit" className="retro-button" data-testid="button-find-file">Find File</button>
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

      {status === 'found' && fileInfo && (
        <div className="border-2 border-blue-800 p-4 bg-[#eeeeff]" data-testid="file-info">
          <table width="100%">
            <tbody>
              <tr>
                <td width="64">
                  <img src="https://win98icons.alexmeub.com/icons/png/file_lines-0.png" width="48" alt="File" />
                </td>
                <td>
                  <b>File Found!</b><br />
                  Filename: <code data-testid="text-filename">{fileInfo.originalName}</code><br />
                  Size: {formatFileSize(fileInfo.size)}<br />
                  Expires: {getTimeRemaining(fileInfo.expiresAt)}
                </td>
              </tr>
            </tbody>
          </table>
          
          <br />
          
          <center>
            <button onClick={handleDownload} className="retro-button font-bold text-lg py-2 px-8" data-testid="button-download-now">
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
          <button onClick={() => setLocation("/")} className="retro-button" data-testid="button-back-home">Back to Home</button>
        </center>
      )}
    </RetroLayout>
  );
}
