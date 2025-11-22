import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { addLog } = useTerminal();

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
    
    setIsUploading(true);
    addLog(`INITIATING_UPLOAD: ${file.name}...`);
    
    const startTime = Date.now();
    const minUploadTime = 3000; // 3 seconds minimum
    
    // Simulate upload progress
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        addLog(`PACKET_TRANSFER: ${Math.floor(Math.random() * 100)}% COMPLETE...`);
      }
    }, 800);

    // Determine total upload time based on size (fake)
    const uploadTime = Math.max(minUploadTime, Math.min(10000, file.size / 100));

    setTimeout(() => {
      clearInterval(interval);
      const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      addLog(`UPLOAD_COMPLETE: 100%`);
      addLog(`GENERATING_HASH... OK`);
      addLog(`SECURE_CODE: ${fakeCode}`);
      
      setIsUploading(false);
      setLocation(`/result/${fakeCode}`);
    }, uploadTime);
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
                /><br /><br />
                
                <b>Step 2: Upload</b><br /><br />
                <button 
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  className="retro-button"
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
                />
                <br /><br />
                <button type="submit" className="retro-button">Download File</button>
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
