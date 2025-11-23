import { useLocation, useRoute } from "wouter";
import { RetroLayout } from "../components/RetroLayout";
import { useTerminal } from "../context/TerminalContext";
import { useEffect } from "react";
import successVideo from '@assets/Game_Intro_Video_Generation_1763880759830.mp4';

export default function UploadResult() {
  const [, params] = useRoute("/result/:code");
  const code = params?.code || "000000";
  const [, setLocation] = useLocation();
  const { addLog } = useTerminal();

  useEffect(() => {
     addLog(`FILE_STORED_AT: /var/www/uploads/${code}`);
     addLog(`EXPIRY_SET: 24_HOURS`);
  }, [code]);

  return (
    <RetroLayout>
      <center>
        <h1><span style={{ color: "green" }}>SUCCESS!</span></h1>
        <video 
          src={successVideo} 
          autoPlay 
          loop 
          muted 
          playsInline
          className="border-2 border-black"
          width="300"
        />
        <br /><br />
        <p>Your file has been uploaded to the World Wide Web.</p>
      </center>
      
      <br />
      
      <div className="border-2 border-black p-4 bg-yellow-100 text-center">
        <p><b>YOUR SECRET CODE:</b></p>
        <h2 className="text-4xl font-mono tracking-widest bg-white border border-black inline-block p-2 my-2">{code}</h2>
        <p className="text-sm">Give this code to your friend.</p>
      </div>
      
      <br />
      
      <p style={{ textAlign: "center" }}>
        <b>Direct Link:</b><br />
        <a href={`/download/${code}`} className="text-blue-600 underline">
          http://www.retrosend.com/download/{code}
        </a>
      </p>
      
      <br /><br />
      
      <center>
        <button onClick={() => setLocation("/")} className="retro-button">
          Upload Another File
        </button>
      </center>
    </RetroLayout>
  );
}
