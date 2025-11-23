import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import Home from "./pages/Home";
import UploadResult from "./pages/UploadResult";
import Download from "./pages/Download";
import Guestbook from "./pages/Guestbook";
import ErrorPage from "./pages/ErrorPage";
import { TerminalProvider } from "./context/TerminalContext";
import { ThemeProvider } from "./components/ThemeProvider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TerminalProvider>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/upload" component={Home} />
            <Route path="/result/:code" component={UploadResult} />
            <Route path="/download" component={Download} />
            <Route path="/download/:code" component={Download} />
            <Route path="/guestbook" component={Guestbook} />
            <Route path="/error" component={ErrorPage} />
            <Route component={ErrorPage} />
          </Switch>
        </TerminalProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
