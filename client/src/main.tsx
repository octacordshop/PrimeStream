import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WatchlistProvider } from "./context/WatchlistContext";
import { RecentlyWatchedProvider } from "./context/RecentlyWatchedContext";

createRoot(document.getElementById("root")!).render(
  <WatchlistProvider>
    <RecentlyWatchedProvider>
      <App />
    </RecentlyWatchedProvider>
  </WatchlistProvider>
);
