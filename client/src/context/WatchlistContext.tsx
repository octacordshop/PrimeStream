import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { fetchWatchlist, addToWatchlist as apiAddToWatchlist, removeFromWatchlist as apiRemoveFromWatchlist } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

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

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  isLoading: false,
  error: null,
  addToWatchlist: async () => {},
  removeFromWatchlist: async () => {},
  isItemInWatchlist: () => false,
});

export const useWatchlist = () => useContext(WatchlistContext);

interface WatchlistProviderProps {
  children: ReactNode;
}

export const WatchlistProvider = ({ children }: WatchlistProviderProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load watchlist on component mount
  useEffect(() => {
    const loadWatchlist = async () => {
      try {
        setIsLoading(true);
        const data = await fetchWatchlist();
        setWatchlist(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load watchlist:', err);
        setError(err instanceof Error ? err : new Error('Failed to load watchlist'));
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchlist();
  }, []);

  // Add item to watchlist
  const addToWatchlist = async (item: { mediaType: string; mediaId: number }) => {
    try {
      const newItem = await apiAddToWatchlist(item);
      setWatchlist(prev => [...prev, newItem]);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    } catch (err) {
      console.error('Failed to add to watchlist:', err);
      setError(err instanceof Error ? err : new Error('Failed to add to watchlist'));
      throw err;
    }
  };

  // Remove item from watchlist
  const removeFromWatchlist = async (mediaType: string, mediaId: number) => {
    try {
      // Find the watchlist item by mediaType and mediaId
      const itemToRemove = watchlist.find(
        item => item.mediaType === mediaType && item.mediaId === mediaId
      );
      
      if (!itemToRemove) {
        throw new Error('Item not found in watchlist');
      }
      
      await apiRemoveFromWatchlist(itemToRemove.id);
      
      // Update local state
      setWatchlist(prev => 
        prev.filter(item => !(item.mediaType === mediaType && item.mediaId === mediaId))
      );
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/watchlist'] });
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
      setError(err instanceof Error ? err : new Error('Failed to remove from watchlist'));
      throw err;
    }
  };

  // Check if item is in watchlist
  const isItemInWatchlist = (mediaType: string, mediaId: number): boolean => {
    return watchlist.some(
      item => item.mediaType === mediaType && item.mediaId === mediaId
    );
  };

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        error,
        addToWatchlist,
        removeFromWatchlist,
        isItemInWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};
