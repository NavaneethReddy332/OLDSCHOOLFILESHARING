import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { addLog, updateLastLog } = useTerminal();
  const { toast } = useToast();
  const lastProgressRef = useRef<number>(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`SELECTED_FILE: ${selectedFile.name}`);
      addLog(`SIZE: ${(selectedFile.size / 1024).toFixed(2)} KB`);
    }
  };

  const handleUpload = async () => {
    if (!file || isUploading) return;
    
    try {
      setIsUploading(true);
      lastProgressRef.current = 0;
      
      addLog(`INITIATING_UPLOAD: ${file.name}...`);
      addLog(`FILE_SIZE: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
      addLog(`ESTABLISHING_CONNECTION...`);
      addLog(`UPLOADING  0%  //////////`);
      
      const formData = new FormData();
      formData.append("file", file);
      if (password) formData.append("password", password);
      if (maxDownloads) formData.append("maxDownloads", maxDownloads);
      formData.append("isOneTime", isOneTime.toString());

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            
            if (percentComplete !== lastProgressRef.current) {
              lastProgressRef.current = percentComplete;
              const dots = '.'.repeat(Math.floor(percentComplete / 10));
              const spaces = '/'.repeat(10 - Math.floor(percentComplete / 10));
              updateLastLog(`UPLOADING  ${percentComplete}%  ${dots}${spaces}`);
            }
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              console.log('Upload successful, response:', data);
              addLog(`UPLOAD_COMPLETE: 100%`);
              addLog(`GENERATING_HASH... OK`);
              if (password) addLog(`ENCRYPTING...`);
              if (maxDownloads) addLog(`LIMIT: ${maxDownloads}`);
              if (isOneTime) addLog(`ONE_TIME_MODE`);
              addLog(`SECURE_CODE: ${data.code}`);
              
              setIsUploading(false);
              
              setTimeout(() => {
                console.log('Navigating to result page:', `/result/${data.code}`);
                setLocation(`/result/${data.code}`);
              }, 800);
              
              resolve(data);
            } catch (error) {
              console.error('Error parsing response:', error, 'Response text:', xhr.responseText);
              addLog(`ERROR: INVALID_RESPONSE`, 'error');
              setIsUploading(false);
              toast({
                title: "Upload Failed",
                description: "Invalid server response",
                variant: "destructive",
              });
              reject(error);
            }
          } else {
            console.error('Upload failed with status:', xhr.status, 'Response:', xhr.responseText);
            addLog(`ERROR: UPLOAD_FAILED - Server returned ${xhr.status}`, 'error');
            setIsUploading(false);
            toast({
              title: "Upload Failed",
              description: `Server error: ${xhr.status}`,
              variant: "destructive",
            });
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', (e) => {
          console.error('Network error:', e);
          addLog(`ERROR: NETWORK_ERROR`, 'error');
          setIsUploading(false);
          toast({
            title: "Upload Failed",
            description: "Network error occurred",
            variant: "destructive",
          });
          reject(new Error('Network error'));
        });

        xhr.addEventListener('abort', () => {
          console.warn('Upload aborted');
          addLog(`ERROR: UPLOAD_CANCELLED`, 'error');
          setIsUploading(false);
          reject(new Error('Upload cancelled'));
        });

        xhr.addEventListener('timeout', () => {
          console.error('Upload timeout');
          addLog(`ERROR: UPLOAD_TIMEOUT`, 'error');
          setIsUploading(false);
          toast({
            title: "Upload Failed",
            description: "Upload timeout - file may be too large",
            variant: "destructive",
          });
          reject(new Error('Upload timeout'));
        });

        xhr.open('POST', '/api/upload');
        xhr.timeout = 300000;
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      addLog(`ERROR: ${error}`, 'error');
    }
  };

  const [downloadCode, setDownloadCode] = useState("");
  
  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadCode.length === 6) {
      addLog(`SEARCH_REQUEST: ${downloadCode}`);
      setLocation(`/download/${downloadCode}`);
    } else {
      addLog(`ERROR: INVALID_CODE_FORMAT`, "error");
      toast({
        title: "Invalid Code Format",
        description: "Please enter a valid 6-digit code.",
        variant: "destructive",
      });
    }
  };

  return (
    <RetroLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="text-red-600 dark:text-red-400">Upload Files Now!</span>
        </h2>
        <p className="text-sm sm:text-base">Share files with your friends easily. No registration required.</p>
      </div>
      
      <div className="retro-border p-4 sm:p-6 md:p-8 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Upload Section */}
          <div className="space-y-4">
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <div className="font-bold mb-3">Step 1: Select File</div>
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="retro-input w-full"
                  data-testid="input-file"
                />
              </div>
              
              <div>
                <div className="font-bold mb-3">Step 2: Security Options (Optional)</div>
                <div className="space-y-3 retro-border-inset p-3">
                  <div>
                    <label className="block text-sm mb-1">Password Protection:</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for no password"
                      className="retro-input w-full text-sm"
                      data-testid="input-password"
                    />
                    <PasswordStrengthMeter password={password} />
                  </div>
                  
                  <div>
                    <label className="block text-sm mb-1">Max Downloads:</label>
                    <input 
                      type="number" 
                      min="1"
                      value={maxDownloads}
                      onChange={(e) => setMaxDownloads(e.target.value)}
                      placeholder="Unlimited"
                      className="retro-input w-full text-sm"
                      data-testid="input-max-downloads"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="oneTime"
                      checked={isOneTime}
                      onChange={(e) => setIsOneTime(e.target.checked)}
                      className="w-4 h-4"
                      data-testid="checkbox-one-time"
                    />
                    <label htmlFor="oneTime" className="text-sm cursor-pointer">
                      Delete after first download
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="font-bold mb-3">Step 3: Upload</div>
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="retro-button"
                  data-testid="button-upload"
                >
                  {isUploading ? "Uploading..." : "Upload Now >>"}
                </button>
              </div>
            </form>
          </div>

          {/* Download Section */}
          <div className="space-y-4 md:border-l-2 md:pl-6 transition-colors duration-300" style={{ borderColor: 'var(--border-shadow)' }}>
            <div className="font-bold mb-3" style={{ color: 'var(--accent)' }}>Already have a code?</div>
            <form onSubmit={handleDownloadSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="font-semibold">Code:</label>
                <input 
                  type="text" 
                  maxLength={6}
                  value={downloadCode}
                  onChange={(e) => setDownloadCode(e.target.value)}
                  className="retro-input sm:flex-1" 
                  placeholder="123456"
                  data-testid="input-code"
                />
              </div>
              <button type="submit" className="retro-button" data-testid="button-download">
                Download File
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <hr className="my-6 transition-colors duration-300" style={{ borderColor: 'var(--border-shadow)' }} />
      
      <div className="mt-6">
        <h3 className="text-xl font-bold mb-3">Why use RetroSend?</h3>
        <ul className="space-y-2 text-sm sm:text-base">
          <li>* Fast 56k modem optimization</li>
          <li>* Works in Netscape & IE</li>
          <li>* No annoying banners (yet)</li>
          <li>* Files deleted after 24 hours</li>
        </ul>
      </div>

    </RetroLayout>
  );
}
