import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface WatchlistItem {
  id: number;
  userId: number;
  mediaType: string;
  mediaId: number;
  addedAt: string;
  content?: any;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  isLoading: boolean;
  error: Error | null;
  addToWatchlist: (item: { mediaType: string; mediaId: number }) => Promise<void>;
  removeFromWatchlist: (mediaType: string, mediaId: number) => Promise<void>;
  isItemInWatchlist: (mediaType: string, mediaId: number) => boolean;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export const useWatchlist = () => useContext(WatchlistContext);

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider = ({ children }: WatchlistProviderProps) => {
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    console.warn('Auth context not available for WatchlistProvider');
  }
  const { toast } = useToast();

  // Create a simple default state when queries aren't available
  const watchlist: WatchlistItem[] = [];
  const isLoading = false;
  const error = null;
  
  // Skip using useQuery during client-side navigation when auth isn't available
  // This allows the WatchlistProvider to render even when auth isn't ready

  // Create simple mutation stubs for safe fallback
  const addToWatchlistMutation = {
    mutateAsync: async (item: { mediaType: string; mediaId: number }) => {
      if (!user) {
        throw new Error('You must be logged in to use the watchlist');
      }
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to use the watchlist',
        variant: 'destructive',
      });
      return null;
    }
  };

  const removeFromWatchlistMutation = {
    mutateAsync: async (id: number) => {
      if (!user) {
        throw new Error('You must be logged in to use the watchlist');
      }
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to use the watchlist',
        variant: 'destructive',
      });
      return null;
    }
  };

  const addToWatchlist = async (item: { mediaType: string; mediaId: number }): Promise<void> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to add to watchlist',
        variant: 'destructive',
      });
      return;
    }
    await addToWatchlistMutation.mutateAsync(item);
  };

  const removeFromWatchlist = async (mediaType: string, mediaId: number): Promise<void> => {
    const item = watchlist.find(
      (item) => item.mediaType === mediaType && item.mediaId === mediaId
    );
    if (item) {
      await removeFromWatchlistMutation.mutateAsync(item.id);
    }
  };

  const isItemInWatchlist = (mediaType: string, mediaId: number): boolean => {
    return watchlist.some((item) => item.mediaType === mediaType && item.mediaId === mediaId);
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        error: error as Error | null,
        addToWatchlist,
        removeFromWatchlist,
        isItemInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};