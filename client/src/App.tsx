import { Switch, Route } from "wouter";
import Home from "./pages/Home";
import UploadResult from "./pages/UploadResult";
import Download from "./pages/Download";
import ErrorPage from "./pages/ErrorPage";

function App() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={Home} /> {/* Alias for home */}
      <Route path="/result/:code" component={UploadResult} />
      <Route path="/download" component={Download} />
      <Route path="/download/:code" component={Download} />
      <Route path="/error" component={ErrorPage} />
      <Route component={ErrorPage} />
    </Switch>
  );
}

export default App;
