import { useLocation } from "wouter";
import { useState } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useMutation } from "@tanstack/react-query";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const { addLog } = useTerminal();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
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

  const handleUpload = () => {
    if (!file) return;
    
    addLog(`INITIATING_UPLOAD: ${file.name}...`);
    
    const progressSteps = [
      { delay: 100, message: 'PACKET_TRANSFER: 15% COMPLETE...' },
      { delay: 300, message: 'PACKET_TRANSFER: 35% COMPLETE...' },
      { delay: 600, message: 'PACKET_TRANSFER: 58% COMPLETE...' },
      { delay: 900, message: 'PACKET_TRANSFER: 72% COMPLETE...' },
      { delay: 1200, message: 'PACKET_TRANSFER: 85% COMPLETE...' },
      { delay: 1500, message: 'PACKET_TRANSFER: 95% COMPLETE...' },
      { delay: 1800, message: 'FINALIZING_TRANSFER...' },
    ];

    const timeouts: NodeJS.Timeout[] = [];
    
    progressSteps.forEach(({ delay, message }) => {
      const timeout = setTimeout(() => {
        if (uploadMutation.isPending || !uploadMutation.isIdle) {
          addLog(message);
        }
      }, delay);
      timeouts.push(timeout);
    });

    uploadMutation.mutate(file, {
      onSettled: () => {
        timeouts.forEach(clearTimeout);
      },
    });
  };

  const [downloadCode, setDownloadCode] = useState("");
  
  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadCode.length === 6) {
      addLog(`SEARCH_REQUEST: ${downloadCode}`);
      setLocation(`/download/${downloadCode}`);
    } else {
      addLog(`ERROR: INVALID_CODE_FORMAT`, "error");
      alert("Please enter a valid 6-digit code.");
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
      
      <div className="bg-[#eeeeee] border-2 border-gray-400 p-4 sm:p-6 md:p-8 mb-6">
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
                <div className="font-bold mb-3">Step 2: Upload</div>
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
          <div className="space-y-4 md:border-l-2 md:border-gray-400 md:pl-6">
            <div className="font-bold text-[#000080] mb-3">Already have a code?</div>
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
      
      <hr className="border-gray-400 my-6" />
      
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
