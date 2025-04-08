import { useState, useEffect, useRef } from 'react';
import { Loader2, Volume2, VolumeX, Maximize, SkipForward, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRecentlyWatched } from '@/context/RecentlyWatchedContext';
import { Button } from '@/components/ui/button';

interface VideoPlayerProps {
  mediaType: 'movie' | 'tv';
  imdbId: string;
  title: string;
  season?: number;
  episode?: number;
  episodeId?: number;
  onClose?: () => void;
  autoPlay?: boolean;
}

export default function VideoPlayer({
  mediaType,
  imdbId,
  title,
  season = 1,
  episode = 1,
  episodeId,
  onClose,
  autoPlay = true
}: VideoPlayerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<string[]>([]);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>('off');
  const [playerReady, setPlayerReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recentlyWatchedContext = useRecentlyWatched();
  
  // Get initial progress
  const initialProgress = recentlyWatchedContext?.getContentProgress?.(
    mediaType, 
    parseInt(imdbId.replace('tt', '')), 
    episodeId
  ) || 0;
  
  // Store progress in state
  const [progress, setProgress] = useState(initialProgress);
  
  // Add to recently watched
  useEffect(() => {
    if (!recentlyWatchedContext?.addToRecentlyWatched) return;
    
    const addToHistory = async () => {
      try {
        await recentlyWatchedContext.addToRecentlyWatched({
          mediaType,
          mediaId: parseInt(imdbId.replace('tt', '')),
          episodeId: episodeId,
          progress: 0
        });
      } catch (error) {
        console.error('Failed to add to watch history:', error);
      }
    };
    
    addToHistory();
  }, [mediaType, imdbId, episodeId, recentlyWatchedContext]);
  
  // Automatically update progress every 30 seconds
  useEffect(() => {
    if (!playerReady || !recentlyWatchedContext?.updateWatchProgress) return;
    
    const intervalId = setInterval(() => {
      // We can't directly access the video element due to CORS restrictions
      // Instead, just update progress incrementally based on time
      // This is an approximation but better than nothing
      setProgress(prev => {
        const newProgress = Math.min(prev + 2, 100); // Increment by ~2% each 30s
        
        // Save progress to backend if context is available
        if (recentlyWatchedContext?.updateWatchProgress && episodeId) {
          recentlyWatchedContext.updateWatchProgress(episodeId, newProgress);
        }
        
        return newProgress;
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [playerReady, episodeId, recentlyWatchedContext]);
  
  // Fetch available subtitles
  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        const response = await fetch(`/api/subtitles/${mediaType}/${imdbId}`);
        if (!response.ok) throw new Error('Failed to fetch subtitles');
        
        const subtitleData = await response.json();
        setSubtitles(subtitleData);
        
        // If subtitles are available, default to English or first available
        if (subtitleData.length > 0) {
          if (subtitleData.includes('en')) {
            setSelectedSubtitle('en');
          } else {
            setSelectedSubtitle(subtitleData[0]);
          }
        }
      } catch (err) {
        console.error('Error fetching subtitles:', err);
      }
    };
    
    fetchSubtitles();
  }, [mediaType, imdbId]);
  
  // Create Vidsrc URL with subtitles if selected
  let vidsrcUrl = '';
  
  if (mediaType === 'movie') {
    vidsrcUrl = `https://vidsrc.xyz/embed/movie?imdb=${imdbId}`;
    if (selectedSubtitle !== 'off') {
      vidsrcUrl += `&ds_lang=${selectedSubtitle}`;
    }
  } else {
    vidsrcUrl = `https://vidsrc.xyz/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`;
    if (selectedSubtitle !== 'off') {
      vidsrcUrl += `&ds_lang=${selectedSubtitle}`;
    }
  }
  
  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    setPlayerReady(true);
  };
  
  // Handle iframe error
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load video player. Please try again later.');
  };
  
  // Enter fullscreen
  const enterFullscreen = () => {
    if (iframeRef.current && iframeRef.current.requestFullscreen) {
      iframeRef.current.requestFullscreen().catch(err => {
        console.error('Could not enter fullscreen mode:', err);
      });
    }
  };
  
  // Handle subtitle change
  const handleSubtitleChange = (value: string) => {
    setSelectedSubtitle(value);
    
    // To change subtitle, we need to reload the iframe with the new subtitle parameter
    let newUrl = '';
    
    if (mediaType === 'movie') {
      newUrl = `https://vidsrc.xyz/embed/movie?imdb=${imdbId}`;
      if (value !== 'off') {
        newUrl += `&ds_lang=${value}`;
      }
    } else {
      newUrl = `https://vidsrc.xyz/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`;
      if (value !== 'off') {
        newUrl += `&ds_lang=${value}`;
      }
    }
    
    if (iframeRef.current) {
      iframeRef.current.src = newUrl;
      setLoading(true); // Show loading again while iframe refreshes
    }
  };
  
  return (
    <div className="relative w-full aspect-video max-h-[80vh] bg-black">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="ml-2 text-lg">Loading player...</span>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <Button onClick={onClose}>Go Back</Button>
        </div>
      )}
      
      <iframe 
        ref={iframeRef}
        src={vidsrcUrl}
        className="w-full h-full"
        allowFullScreen
        allow="fullscreen"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        frameBorder="0"
      />
      
      {/* Subtitle selector removed as requested */}
    </div>
  );
}

// Helper to convert language codes to names
function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    it: 'Italian',
    pt: 'Portuguese',
    ru: 'Russian',
    ja: 'Japanese',
    ko: 'Korean',
    zh: 'Chinese',
    ar: 'Arabic',
    hi: 'Hindi',
    tr: 'Turkish',
    nl: 'Dutch',
    pl: 'Polish',
    sv: 'Swedish',
    da: 'Danish',
    fi: 'Finnish',
    no: 'Norwegian',
    cs: 'Czech',
    th: 'Thai',
    vi: 'Vietnamese',
    ms: 'Malay',
    id: 'Indonesian'
  };
  
  return languages[code] || code.toUpperCase();
}