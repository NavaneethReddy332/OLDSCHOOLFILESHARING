import { useLocation } from "wouter";
import { useState, useRef } from "react";
import { RetroLayout } from "../components/RetroLayout";

export default function Home() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    
    setIsUploading(true);
    
    // Simulate network delay for upload
    setTimeout(() => {
      // Mock upload success - navigate to result with a fake code
      const fakeCode = Math.floor(100000 + Math.random() * 900000).toString();
      setIsUploading(false);
      setLocation(`/result/${fakeCode}`);
    }, 2000);
  };

  const [downloadCode, setDownloadCode] = useState("");
  
  const handleDownloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (downloadCode.length === 6) {
      setLocation(`/download/${downloadCode}`);
    } else {
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
