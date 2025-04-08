import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute, AdminProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import MoviePage from "@/pages/MoviePage";
import TVShowPage from "@/pages/TVShowPage";
import MyListPage from "@/pages/MyListPage";
import SearchPage from "@/pages/SearchPage";
import AdminPage from "@/pages/AdminPage";
import WatchPage from "@/pages/WatchPage";
import AuthPage from "@/pages/auth-page";
import UserProfilePage from "@/pages/UserProfilePage";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useEffect } from "react";
import { RecentlyWatchedProvider } from "@/context/RecentlyWatchedContext";
import { WatchlistProvider } from "@/context/WatchlistContext";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-prime-dark text-white">
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/watch/:mediaType/:id">
          {/* Watch page doesn't have header/footer for fullscreen viewing */}
          <main className="min-h-screen bg-black">
            <WatchPage />
          </main>
        </ProtectedRoute>
        <Route path="*">
          <div className="flex flex-col min-h-screen bg-prime-dark text-white">
            <Header />
            <main className="flex-grow">
              <Switch>
                <ProtectedRoute path="/" component={HomePage} />
                <ProtectedRoute path="/movie/:id" component={MoviePage} />
                <ProtectedRoute path="/show/:id" component={TVShowPage} />
                <ProtectedRoute path="/my-list" component={MyListPage} />
                <ProtectedRoute path="/search" component={SearchPage} />
                <ProtectedRoute path="/profile" component={UserProfilePage} />
                <AdminProtectedRoute path="/admin" component={AdminPage} />
                <Route component={NotFound} />
              </Switch>
            </main>
            <Footer />
          </div>
        </Route>
      </Switch>
    </div>
  );
}

function App() {
  const { toast } = useToast();
  
  useEffect(() => {
    // Handle network status changes
    const handleOffline = () => {
      toast({
        title: "You are offline",
        description: "Please check your internet connection",
        variant: "destructive"
      });
    };
    
    const handleOnline = () => {
      toast({
        title: "You are back online",
        description: "Reconnected to the internet"
      });
    };
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WatchlistProvider>
          <RecentlyWatchedProvider>
            <Router />
            <Toaster />
          </RecentlyWatchedProvider>
        </WatchlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
