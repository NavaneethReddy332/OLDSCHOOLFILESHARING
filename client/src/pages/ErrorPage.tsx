import { useLocation } from "wouter";
import { RetroLayout } from "../components/RetroLayout";

export default function ErrorPage() {
  const [, setLocation] = useLocation();

  return (
    <RetroLayout>
      <center>
        <h1><span style={{ color: "red" }}>ERROR!</span></h1>
        <img src="https://win98icons.alexmeub.com/icons/png/msg_error-0.png" alt="Critical Error" width="64" />
        <br /><br />
        <h2 className="text-xl bg-blue-900 text-white p-2 inline-block font-mono">FATAL EXCEPTION</h2>
      </center>
      
      <br />
      
      <div className="border-2 border-red-800 p-4 bg-red-100">
        <p className="font-mono text-red-900 font-bold mb-4">
          A fatal exception 0E has occurred at 0028:C0034B23 in VXD VMM(01) + 000034B23. 
          The current application will be terminated.
        </p>
        
        <ul className="list-disc list-inside font-mono text-sm space-y-2">
           <li>* Press any key to terminate the current application.</li>
           <li>* Press CTRL+ALT+DEL again to restart your computer. You will lose any unsaved information in all applications.</li>
        </ul>
      </div>
      
      <br />
      
      <center>
        <button onClick={() => setLocation("/")} className="retro-button text-red-600 font-bold">
           &lt;&lt; RETURN TO SAFETY
        </button>
      </center>

      <br/>
      
      <div className="text-xs font-mono border-t border-gray-400 pt-2 text-gray-500">
        Debug Info: STACK_OVERFLOW / NULL_POINTER_EXCEPTION / FILE_CORRUPTED
      </div>
    </RetroLayout>
  );
}
