import { useEffect, useState } from 'react';
import { X, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecentlyWatched } from '@/context/RecentlyWatchedContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';

interface VideoPlayerProps {
  contentType: 'movie' | 'tv';
  imdbId: string;
  title: string;
  season?: number;
  episode?: number;
  episodeId?: number;
  onClose: () => void;
}

// Language names mapping
const languageNames: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian'
};

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
  const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
  const { addToRecentlyWatched } = useRecentlyWatched();
  const { toast } = useToast();
  
  // Fetch available subtitles
  const { data: availableSubtitles = [] } = useQuery({
    queryKey: ['/api/subtitles', contentType, imdbId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/subtitles/${contentType}/${imdbId}`);
        if (!response.ok) return [];
        return await response.json();
      } catch (error) {
        console.error('Error fetching subtitles:', error);
        return [];
      }
    },
    enabled: !!imdbId
  });
  
  // Construct the embed URL based on content type and parameters
  const getEmbedUrl = () => {
    let baseUrl = contentType === 'movie' 
      ? `https://vidsrc.me/embed/movie?imdb=${imdbId}` 
      : `https://vidsrc.me/embed/tv?imdb=${imdbId}`;
    
    // Add season and episode parameters if provided
    if (contentType === 'tv' && season && episode) {
      baseUrl += `&season=${season}&episode=${episode}`;
    }
    
    // Add subtitle parameter if selected
    if (selectedSubtitle) {
      baseUrl += `&ds_lang=${selectedSubtitle}`;
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
      
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {availableSubtitles.length > 0 && (
          <div className="relative bg-black/50 rounded-md p-1 flex items-center">
            <Languages className="h-4 w-4 text-white mr-1" />
            <Select 
              value={selectedSubtitle || ""} 
              onValueChange={(value) => {
                if (value) {
                  setSelectedSubtitle(value);
                  setIframeLoaded(false); // Reload iframe when subtitle changes
                } else {
                  setSelectedSubtitle(null);
                }
              }}
            >
              <SelectTrigger className="bg-transparent border-0 text-white h-8 w-28 focus:ring-0">
                <SelectValue placeholder="Subtitles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {availableSubtitles.map((lang: string) => (
                  <SelectItem key={lang} value={lang}>
                    {languageNames[lang] || lang}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
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
