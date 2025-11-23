import { useLocation } from "wouter";
import { useState } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [maxDownloads, setMaxDownloads] = useState("");
  const [isOneTime, setIsOneTime] = useState(false);
  const { addLog } = useTerminal();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (fileData: { file: File; password: string; maxDownloads: string; isOneTime: boolean }) => {
      const formData = new FormData();
      formData.append("file", fileData.file);
      if (fileData.password) formData.append("password", fileData.password);
      if (fileData.maxDownloads) formData.append("maxDownloads", fileData.maxDownloads);
      formData.append("isOneTime", fileData.isOneTime.toString());
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      addLog(`UPLOAD_COMPLETE: 100%`);
      addLog(`GENERATING_HASH... OK`);
      addLog(`SECURE_CODE: ${data.code}`);
      setTimeout(() => {
        setLocation(`/result/${data.code}`);
      }, 400);
    },
    onError: (error) => {
      addLog(`ERROR: UPLOAD_FAILED - ${error.message}`, 'error');
      toast({
        title: "Upload Failed",
        description: error.message || "An error occurred while uploading your file. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      addLog(`SELECTED_FILE: ${selectedFile.name}`);
      addLog(`SIZE: ${(selectedFile.size / 1024).toFixed(2)} KB`);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    addLog(`INITIATING_UPLOAD: ${file.name}...`);
    addLog(`FILE_SIZE: ${(file.size / 1024).toFixed(2)} KB`);
    
    // Simulate upload progress smoothly
    const simulateProgress = async () => {
      const steps = [
        { msg: 'ESTABLISHING_CONNECTION...', delay: 50 },
        { msg: 'CONNECTION_ESTABLISHED', delay: 80 },
        { msg: 'ALLOCATING_BUFFER...', delay: 60 },
        { msg: 'ENCODING_DATA...', delay: 70 },
        { msg: 'TRANSFER: █░░░░░░░░░ 10%', delay: 100 },
        { msg: 'TRANSFER: ███░░░░░░░ 30%', delay: 120 },
        { msg: 'TRANSFER: █████░░░░░ 50%', delay: 100 },
        { msg: 'TRANSFER: ███████░░░ 70%', delay: 120 },
        { msg: 'TRANSFER: █████████░ 90%', delay: 100 },
      ];
      
      for (const step of steps) {
        await new Promise(resolve => setTimeout(resolve, step.delay));
        addLog(step.msg);
      }
      
      if (password) addLog(`ENCRYPTING...`);
      if (maxDownloads) addLog(`LIMIT: ${maxDownloads}`);
      if (isOneTime) addLog(`ONE_TIME_MODE`);
    };
    
    simulateProgress();
    uploadMutation.mutate({ file, password, maxDownloads, isOneTime });
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

  const isUploading = uploadMutation.isPending;

  return (
    <RetroLayout>
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">
          <span className="text-red-600">Upload Files Now!</span>
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
