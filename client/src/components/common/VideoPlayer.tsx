import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecentlyWatched } from '@/context/RecentlyWatchedContext';
import { useToast } from '@/hooks/use-toast';

interface VideoPlayerProps {
  contentType: 'movie' | 'tv';
  imdbId: string;
  title: string;
  season?: number;
  episode?: number;
  episodeId?: number;
  onClose: () => void;
}

const VideoPlayer = ({
  contentType,
  imdbId,
  title,
  season,
  episode,
  episodeId,
  onClose
}: VideoPlayerProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const { addToRecentlyWatched } = useRecentlyWatched();
  const { toast } = useToast();
  
  // Construct the embed URL based on content type and parameters
  const getEmbedUrl = () => {
    let baseUrl = contentType === 'movie' 
      ? `https://vidsrc.xyz/embed/movie?imdb=${imdbId}` 
      : `https://vidsrc.xyz/embed/tv?imdb=${imdbId}`;
    
    // Add season and episode parameters if provided
    if (contentType === 'tv' && season && episode) {
      baseUrl += `&season=${season}&episode=${episode}`;
    }
    
    return baseUrl;
  };
  
  // Track content in recently watched when played
  useEffect(() => {
    const saveToRecentlyWatched = async () => {
      try {
        await addToRecentlyWatched({
          mediaType: contentType,
          mediaId: parseInt(imdbId.replace('tt', '')),
          episodeId: episodeId,
          progress: 0
        });
      } catch (error) {
        console.error('Failed to add to recently watched:', error);
      }
    };
    
    // Add a slight delay to ensure we only track views when content is actually watched
    const timer = setTimeout(saveToRecentlyWatched, 5000);
    
    return () => clearTimeout(timer);
  }, [contentType, imdbId, episodeId, addToRecentlyWatched]);
  
  // Handle keyboard events (ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Prevent scrolling of the background content
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  const handleIframeError = () => {
    toast({
      title: "Playback Error",
      description: "Unable to load the video. Please try again later.",
      variant: "destructive"
    });
    
    setIframeLoaded(false);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black" onClick={onClose}></div>
      
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost"
          size="icon"
          className="bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors" 
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="relative h-full flex items-center justify-center">
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-prime-dark-light">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prime-blue mb-4"></div>
              <h3 className="text-white text-xl mb-2">Loading player...</h3>
              <p className="text-prime-gray max-w-md mx-auto">
                Getting ready to play: {title}
              </p>
            </div>
          </div>
        )}
        
        <iframe
          src={getEmbedUrl()}
          className="w-full h-full max-w-6xl max-h-[80vh]"
          allowFullScreen
          title={title}
          onLoad={() => setIframeLoaded(true)}
          onError={handleIframeError}
        ></iframe>
      </div>
    </div>
  );
};

export default VideoPlayer;
