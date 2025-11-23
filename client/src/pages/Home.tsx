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
      <center>
        <h2><span style={{ color: "red" }}>Upload Files Now!</span></h2>
        <p>Share files with your friends easily. No registration required.</p>
      </center>
      
      <br />
      
      <table width="100%" border={0} style={{ backgroundColor: "#eeeeee" }} cellPadding={10} className="border-2 border-gray-400">
        <tbody>
          <tr>
            <td width="50%" valign="top">
              <form onSubmit={(e) => e.preventDefault()}>
                <b>Step 1: Select File</b><br /><br />
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="retro-input w-full"
                  data-testid="input-file"
                /><br /><br />
                
                <b>Step 2: Upload</b><br /><br />
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="retro-button"
                  data-testid="button-upload"
                >
                  {isUploading ? "Uploading..." : "Upload Now >>"}
                </button>
              </form>
            </td>
            <td width="50%" valign="top" className="border-l-2 border-gray-400 pl-4">
              <b><span style={{ color: "#000080" }}>Already have a code?</span></b><br /><br />
              <form onSubmit={handleDownloadSubmit}>
                Code: <input 
                  type="text" 
                  size={8} 
                  maxLength={6}
                  value={downloadCode}
                  onChange={(e) => setDownloadCode(e.target.value)}
                  className="retro-input" 
                  placeholder="123456"
                  data-testid="input-code"
                />
                <br /><br />
                <button type="submit" className="retro-button" data-testid="button-download">Download File</button>
              </form>
            </td>
          </tr>
        </tbody>
      </table>
      
      <br />
      <hr />
      <br />
      
      <h3>Why use RetroSend?</h3>
      <ul>
        <li>* Fast 56k modem optimization</li>
        <li>* Works in Netscape & IE</li>
        <li>* No annoying banners (yet)</li>
        <li>* Files deleted after 24 hours</li>
      </ul>

    </RetroLayout>
  );
}
