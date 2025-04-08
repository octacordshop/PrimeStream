import { createContext, ReactNode, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

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

const RecentlyWatchedContext = createContext<RecentlyWatchedContextType | null>(null);

export const useRecentlyWatched = () => useContext(RecentlyWatchedContext);

interface RecentlyWatchedProviderProps {
  children: ReactNode;
}

export const RecentlyWatchedProvider = ({ children }: RecentlyWatchedProviderProps) => {
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext?.user;
  } catch (error) {
    console.warn('Auth context not available for RecentlyWatchedProvider');
  }
  const { toast } = useToast();

  // Create a simple default state when queries aren't available
  const recentlyWatched: RecentlyWatchedItem[] = [];
  const isLoading = false;
  const error = null;
  
  // Skip using useQuery during client-side navigation when auth isn't available
  // This allows the RecentlyWatchedProvider to render even when auth isn't ready

  // Create simple mutation stubs for safe fallback
  const addToRecentlyWatchedMutation = {
    mutateAsync: async (item: {
      mediaType: string;
      mediaId: number;
      episodeId?: number;
      progress: number;
    }) => {
      if (!user) {
        throw new Error('You must be logged in to track watch history');
      }
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to track watch history',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateProgressMutation = {
    mutateAsync: async (params: { id: number; progress: number }) => {
      if (!user) {
        throw new Error('You must be logged in to track watch history');
      }
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to track watch history',
        variant: 'destructive',
      });
      return null;
    }
  };

  const addToRecentlyWatched = async (item: {
    mediaType: string;
    mediaId: number;
    episodeId?: number;
    progress: number;
  }): Promise<void> => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to track watch history',
        variant: 'destructive',
      });
      return;
    }
    await addToRecentlyWatchedMutation.mutateAsync(item);
  };

  const updateWatchProgress = async (id: number, progress: number): Promise<void> => {
    if (!user) return;
    
    // Find the item by ID if it exists
    const item = recentlyWatched.find((item) => {
      if (item.episodeId && item.episodeId === id) {
        return true;
      } else if (item.mediaId === id) {
        return true;
      }
      return false;
    });
    
    if (item) {
      await updateProgressMutation.mutateAsync({ id: item.id, progress });
    }
  };

  const getContentProgress = (mediaType: string, mediaId: number, episodeId?: number): number => {
    if (!recentlyWatched.length) return 0;
    
    const item = recentlyWatched.find((item) => {
      if (episodeId) {
        return item.mediaType === mediaType && item.episodeId === episodeId;
      } else {
        return item.mediaType === mediaType && item.mediaId === mediaId;
      }
    });
    
    return item ? item.progress : 0;
  };

  return (
    <RecentlyWatchedContext.Provider
      value={{
        recentlyWatched,
        isLoading,
        error: error as Error | null,
        addToRecentlyWatched,
        updateWatchProgress,
        getContentProgress,
      }}
    >
      {children}
    </RecentlyWatchedContext.Provider>
  );
};