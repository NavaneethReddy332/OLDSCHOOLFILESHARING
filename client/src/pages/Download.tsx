import { useLocation, useRoute } from "wouter";
import { useState, useEffect } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface FileInfo {
  code: string;
  originalName: string;
  size: number;
  mimetype: string;
  uploadedAt: string;
  expiresAt: string;
  isPasswordProtected: number;
  downloadCount: number;
  maxDownloads: number | null;
  remainingDownloads: number | null;
  isOneTime: number;
}

export default function Download() {
  const [, params] = useRoute("/download/:code");
  const code = params?.code;
  const [, setLocation] = useLocation();
  const { addLog } = useTerminal();
  const { toast } = useToast();
  
  const [inputCode, setInputCode] = useState("");

  const { data: fileInfo, isLoading, isError, error } = useQuery<FileInfo>({
    queryKey: ['/api/file', code],
    enabled: !!code,
    retry: false,
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

  const [downloadPassword, setDownloadPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleGetDownloadLink = async () => {
    if (!code || !fileInfo) return;
    
    if (fileInfo.isPasswordProtected && !showPasswordInput) {
      setShowPasswordInput(true);
      addLog(`PASSWORD_REQUIRED`);
      return;
    }
    
    setIsGeneratingLink(true);
    addLog(`GENERATING_DOWNLOAD_LINK...`);
    
    try {
      const response = await fetch(`/api/file/${code}/get-download-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: fileInfo.isPasswordProtected ? downloadPassword : undefined })
      });

      if (!response.ok) {
        const error = await response.json();
        addLog(`ERROR: ${error.error}`, 'error');
        toast({
          title: "Error",
          description: error.error || "Failed to generate download link",
          variant: "destructive",
        });
        setIsGeneratingLink(false);
        return;
      }

      const data = await response.json();
      let finalDownloadUrl = data.downloadUrl;
      
      if (data.requiresPassword && downloadPassword) {
        finalDownloadUrl += `?password=${encodeURIComponent(downloadPassword)}`;
      }
      
      setDownloadLink(finalDownloadUrl);
      addLog(`LINK_GENERATED_SUCCESSFULLY`);
      addLog(`LINK_VALID_UNTIL_FILE_EXPIRES`);
      setIsGeneratingLink(false);
      
      toast({
        title: "Download Link Ready",
        description: "Your shareable download link has been generated!",
      });
    } catch (error) {
      addLog(`ERROR: ${error instanceof Error ? error.message : 'Failed to generate link'}`, 'error');
      setIsGeneratingLink(false);
    }
  };

  const handleDownload = () => {
    if (downloadLink) {
      addLog(`INITIATING_DOWNLOAD...`);
      window.location.href = downloadLink;
      setTimeout(() => {
        addLog(`DOWNLOAD_STARTED`);
      }, 500);
    }
  };

  const copyToClipboard = async () => {
    if (downloadLink) {
      try {
        await navigator.clipboard.writeText(downloadLink);
        toast({
          title: "Copied!",
          description: "Download link copied to clipboard",
        });
        addLog(`LINK_COPIED_TO_CLIPBOARD`);
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Please copy the link manually",
          variant: "destructive",
        });
      }
    }
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
           <form onSubmit={handleManualSubmit} className="bg-gray-200 dark:bg-gray-800 p-8 border-2 border-gray-300 dark:border-gray-600 shadow-md inline-block">
             Code: <input 
               type="text" 
               value={inputCode}
               onChange={(e) => setInputCode(e.target.value)}
               className="retro-input" 
              placeholder="123456"
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
          <div className="w-64 h-4 border-2 border-gray-500 dark:border-gray-400 bg-white dark:bg-gray-800 p-0.5 relative">
             <div className="h-full bg-blue-700 dark:bg-blue-500 animate-[width_2s_ease-in-out_infinite]" style={{width: '50%'}}></div>
          </div>
          <p><small>Please wait...</small></p>
        </center>
      )}

      {status === 'found' && fileInfo && (
        <div className="border-2 border-blue-800 dark:border-blue-400 p-4 bg-[#eeeeff] dark:bg-blue-950/30" data-testid="file-info">
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
                  Expires: {getTimeRemaining(fileInfo.expiresAt)}<br />
                  {fileInfo.isPasswordProtected === 1 && (
                    <><img src="https://win98icons.alexmeub.com/icons/png/lock_key-0.png" width="16" className="inline" alt="Protected" /> Password Protected<br /></>
                  )}
                  {fileInfo.isOneTime === 1 && (
                    <><b className="text-red-600 dark:text-red-400">⚠ One-time download only</b><br /></>
                  )}
                  Downloads: <span data-testid="text-download-count">{fileInfo.downloadCount}</span>
                  {fileInfo.maxDownloads && (
                    <> / {fileInfo.maxDownloads} <span className="text-sm">(Remaining: {fileInfo.remainingDownloads})</span></>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          
          <br />
          
          {showPasswordInput && (
            <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-600 dark:border-yellow-500 p-3">
              <label className="block mb-2 font-bold">Enter Password:</label>
              <input 
                type="password" 
                value={downloadPassword}
                onChange={(e) => setDownloadPassword(e.target.value)}
                className="retro-input w-full mb-2"
                placeholder="Enter file password"
                autoComplete="off"
                data-testid="input-download-password"
              />
            </div>
          )}
          
          {downloadLink && (
            <div className="mb-4 bg-green-100 dark:bg-green-900/30 border-2 border-green-600 dark:border-green-500 p-3">
              <label className="block mb-2 font-bold">Your Shareable Download Link:</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={downloadLink}
                  readOnly
                  className="retro-input flex-1 text-xs"
                  data-testid="text-download-link"
                />
                <button onClick={copyToClipboard} className="retro-button text-sm px-4" data-testid="button-copy-link">
                  Copy
                </button>
              </div>
              <small className="block mt-2">This link works on any device/browser. Share it anywhere!</small>
            </div>
          )}
          
          <center>
            {!downloadLink ? (
              <button 
                onClick={handleGetDownloadLink} 
                disabled={isGeneratingLink}
                className="retro-button font-bold text-lg py-2 px-8" 
                data-testid="button-get-download-link"
              >
                {isGeneratingLink ? "GENERATING..." : "GET DOWNLOAD LINK"}
              </button>
            ) : (
              <button onClick={handleDownload} className="retro-button font-bold text-lg py-2 px-8" data-testid="button-download-now">
                DOWNLOAD NOW
              </button>
            )}
            <br /><br />
            <small>Checked by Norton AntiVirus</small>
          </center>
        </div>
      )}

      {status === 'error' && (
        <center>
          <img src="https://win98icons.alexmeub.com/icons/png/msg_warning-0.png" alt="Error" />
          <h3 className="text-red-600 dark:text-red-400 mt-4">Error 404: File Not Found</h3>
          <p>The file you are looking for has expired or does not exist.</p>
          <br />
          <button onClick={() => setLocation("/")} className="retro-button" data-testid="button-back-home">Back to Home</button>
        </center>
      )}
    </RetroLayout>
  );
}
