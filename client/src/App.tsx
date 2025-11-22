import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import UploadResult from "./pages/UploadResult";
import Download from "./pages/Download";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Home} /> {/* Alias for home */}
      <Route path="/result/:code" component={UploadResult} />
      <Route path="/download" component={Download} />
      <Route path="/download/:code" component={Download} />
      <Route>
        {/* 404 Page */}
        <div className="bg-blue-900 text-white min-h-screen font-mono p-8 text-center">
          <h1 className="text-4xl mb-8">404 FATAL ERROR</h1>
          <p>A fatal exception 0E has occurred at 0028:C0034B23.</p>
          <p>The current application will be terminated.</p>
          <br />
          <p>* Press any key to terminate the current application.</p>
          <p>* Press CTRL+ALT+DEL again to restart your computer.</p>
          <br />
          <br />
          <a href="/" className="text-white underline">Return to Windows</a>
        </div>
      </Route>
    </Switch>
  );
}

export default App;
