import { useLocation, useRoute } from "wouter";
import { RetroLayout } from "../components/RetroLayout";

export default function UploadResult() {
  const [, params] = useRoute("/result/:code");
  const code = params?.code || "000000";
  const [, setLocation] = useLocation();

  return (
    <RetroLayout>
      <center>
        <h1><span style={{ color: "green" }}>SUCCESS!</span></h1>
        <img src="https://media.giphy.com/media/11fuEnXyGsXg5i/giphy.gif" alt="Computer kid" width="150" />
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
