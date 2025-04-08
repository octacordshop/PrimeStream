import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { 
  fetchRecentlyWatched, 
  addToRecentlyWatched as apiAddToRecentlyWatched, 
  updateWatchProgress as apiUpdateWatchProgress 
} from '@/lib/api';
import { queryClient } from '@/lib/queryClient';

interface RecentlyWatchedItem {
  id: number;
  userId: number;
  mediaType: string;
  mediaId: number;
  episodeId?: number;
  watchedAt: string;
  progress: number;
  content?: any;
  episode?: any;
}

interface RecentlyWatchedContextType {
  recentlyWatched: RecentlyWatchedItem[];
  isLoading: boolean;
  error: Error | null;
  addToRecentlyWatched: (item: {
    mediaType: string;
    mediaId: number;
    episodeId?: number;
    progress: number;
  }) => Promise<void>;
  updateWatchProgress: (id: number, progress: number) => Promise<void>;
  getContentProgress: (mediaType: string, mediaId: number, episodeId?: number) => number;
}

const RecentlyWatchedContext = createContext<RecentlyWatchedContextType>({
  recentlyWatched: [],
  isLoading: false,
  error: null,
  addToRecentlyWatched: async () => {},
  updateWatchProgress: async () => {},
  getContentProgress: () => 0,
});

export const useRecentlyWatched = () => useContext(RecentlyWatchedContext);

interface RecentlyWatchedProviderProps {
  children: ReactNode;
}

export const RecentlyWatchedProvider = ({ children }: RecentlyWatchedProviderProps) => {
  const [recentlyWatched, setRecentlyWatched] = useState<RecentlyWatchedItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Load recently watched on component mount
  useEffect(() => {
    const loadRecentlyWatched = async () => {
      try {
        setIsLoading(true);
        const data = await fetchRecentlyWatched();
        setRecentlyWatched(data);
        setError(null);
      } catch (err) {
        console.error('Failed to load recently watched:', err);
        setError(err instanceof Error ? err : new Error('Failed to load recently watched'));
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentlyWatched();
  }, []);

  // Add item to recently watched
  const addToRecentlyWatched = async (item: {
    mediaType: string;
    mediaId: number;
    episodeId?: number;
    progress: number;
  }) => {
    try {
      const newItem = await apiAddToRecentlyWatched(item);
      
      // Update local state - replace if exists, otherwise add
      setRecentlyWatched(prev => {
        const existingIndex = prev.findIndex(
          i => 
            i.mediaType === item.mediaType && 
            i.mediaId === item.mediaId && 
            i.episodeId === item.episodeId
        );
        
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newItem;
          return updated;
        }
        
        return [newItem, ...prev];
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/recently-watched'] });
    } catch (err) {
      console.error('Failed to add to recently watched:', err);
      setError(err instanceof Error ? err : new Error('Failed to add to recently watched'));
      throw err;
    }
  };

  // Update watch progress
  const updateWatchProgress = async (id: number, progress: number) => {
    try {
      const updatedItem = await apiUpdateWatchProgress(id, progress);
      
      // Update local state
      setRecentlyWatched(prev => 
        prev.map(item => item.id === id ? updatedItem : item)
      );
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/recently-watched'] });
    } catch (err) {
      console.error('Failed to update watch progress:', err);
      setError(err instanceof Error ? err : new Error('Failed to update watch progress'));
      throw err;
    }
  };

  // Get progress for specific content
  const getContentProgress = (mediaType: string, mediaId: number, episodeId?: number): number => {
    const item = recentlyWatched.find(
      i => 
        i.mediaType === mediaType && 
        i.mediaId === mediaId && 
        (episodeId ? i.episodeId === episodeId : true)
    );
    
    return item ? item.progress : 0;
  };

  return (
    <RecentlyWatchedContext.Provider
      value={{
        recentlyWatched,
        isLoading,
        error,
        addToRecentlyWatched,
        updateWatchProgress,
        getContentProgress,
      }}
    >
      {children}
    </RecentlyWatchedContext.Provider>
  );
};
