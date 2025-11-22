import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { RetroProgressBar } from "../components/RetroProgressBar";
import { RetroPopup } from "../components/RetroPopup";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState<{isOpen: boolean, title: string, msg: string, type: 'info' | 'error' | 'warning'}>({
    isOpen: false, title: "", msg: "", type: 'info'
  });

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
    setUploadProgress(0);
    addLog(`INITIATING_UPLOAD: ${file.name}...`);
    
    const minUploadTime = 3000;
    const uploadTime = Math.max(minUploadTime, Math.min(10000, file.size / 100));
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / uploadTime) * 100);
      setUploadProgress(progress);

      if (Math.random() > 0.85) {
        addLog(`PACKET_TRANSFER: ${Math.floor(progress)}% COMPLETE...`);
      }

      if (progress >= 100) {
        clearInterval(interval);
        const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        addLog(`UPLOAD_COMPLETE: 100%`);
        addLog(`GENERATING_HASH... OK`);
        
        // Simulate code generation delay
        setTimeout(() => {
          addLog(`SECURE_CODE: ${fakeCode}`);
          setGeneratedCode(fakeCode);
          setIsUploading(false);
          setShowPopup({
             isOpen: true,
             title: "Upload Successful",
             msg: "File successfully transmitted to server. Click OK to view details.",
             type: "info"
          });
        }, 1000);
      }
    }, 100);
  };

  const [downloadCode, setDownloadCode] = useState("");
  
  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadCode.length === 6) {
      addLog(`SEARCH_REQUEST: ${downloadCode}`);
      setLocation(`/download/${downloadCode}`);
    } else {
      addLog(`ERROR: INVALID_CODE_FORMAT`, "error");
      setShowPopup({
        isOpen: true,
        title: "Invalid Code",
        msg: "The code you entered is invalid. It must be exactly 6 digits.",
        type: "error"
      });
    }
  };

  const handlePopupClose = () => {
    setShowPopup(prev => ({ ...prev, isOpen: false }));
    if (generatedCode) {
      setLocation(`/result/${generatedCode}`);
    }
  };

  return (
    <RetroLayout>
      <RetroPopup 
        isOpen={showPopup.isOpen} 
        onClose={handlePopupClose}
        title={showPopup.title}
        message={showPopup.msg}
        type={showPopup.type}
      />

      <center>
        <h2><span style={{ color: "red" }}>Upload Files Now!</span></h2>
        <p>Share files with your friends easily. No registration required.</p>
      </center>
      
      <br />
      
      <table width="100%" border={0} style={{ backgroundColor: "#eeeeee" }} cellPadding={10} className="border-2 border-gray-400">
        <tbody>
          <tr>
            <td width="50%" valign="top">
              <pre className="text-[10px] font-mono leading-none mb-2">
{`
 ____  _       _             
|  _ \\(_) __ _| |_ ___  _ __ 
| |_) | |/ _\` | __/ _ \\| '__|
|  _ <| | (_| | || (_) | |   
|_| \\_\\_|\\__,_|\\__\\___/|_|   
`}
              </pre>
              <form onSubmit={(e) => e.preventDefault()}>
                <b>Step 1: Select File</b><br /><br />
                <input 
                  type="file" 
                  onChange={handleFileChange}
                  className="retro-input w-full"
                /><br /><br />
                
                <b>Step 2: Upload</b><br /><br />
                
                {isUploading ? (
                  <div>
                    <RetroProgressBar progress={uploadProgress} label="Uploading via 56k modem..." />
                    <br />
                    <center className="blink text-xs text-blue-800">Transmitting Data...</center>
                  </div>
                ) : (
                  <button 
                    onClick={handleUpload}
                    disabled={!file}
                    className="retro-button"
                  >
                    Upload Now &gt;&gt;
                  </button>
                )}
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
