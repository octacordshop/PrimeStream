import { useState, useEffect } from 'react';
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
  const [muted, setMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const { addToRecentlyWatched, updateWatchProgress, getContentProgress } = useRecentlyWatched();
  
  // Get initial progress
  const initialProgress = getContentProgress(mediaType, parseInt(imdbId.replace('tt', '')), episodeId);
  
  // Store progress in state
  const [progress, setProgress] = useState(initialProgress);
  
  // Track playback progress
  useEffect(() => {
    if (!playerReady) return;
    
    const intervalId = setInterval(() => {
      // Update progress every 5 seconds
      const videoElement = document.querySelector('iframe')?.contentWindow?.document.querySelector('video');
      if (videoElement) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;
        
        if (currentTime && duration) {
          const progressPercent = Math.floor((currentTime / duration) * 100);
          setProgress(progressPercent);
          
          // Save progress to backend
          if (mediaType === 'movie') {
            updateWatchProgress(episodeId || 0, progressPercent);
          } else {
            updateWatchProgress(episodeId || 0, progressPercent);
          }
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [playerReady, episodeId, mediaType, updateWatchProgress]);
  
  // Add to recently watched
  useEffect(() => {
    const addToHistory = async () => {
      try {
        await addToRecentlyWatched({
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
  }, [mediaType, imdbId, episodeId, addToRecentlyWatched]);
  
  // Fetch available subtitles
  useEffect(() => {
    const fetchSubtitles = async () => {
      try {
        const response = await fetch(`/api/subtitles/${mediaType}/${imdbId}`);
        if (!response.ok) throw new Error('Failed to fetch subtitles');
        
        const subtitleData = await response.json();
        setSubtitles(subtitleData);
      } catch (err) {
        console.error('Error fetching subtitles:', err);
      }
    };
    
    fetchSubtitles();
  }, [mediaType, imdbId]);
  
  // Create Vidsrc URL
  const vidsrcUrl = mediaType === 'movie'
    ? `https://vidsrc.to/embed/movie/${imdbId}`
    : `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`;
  
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
    const iframe = document.querySelector('iframe');
    if (iframe) {
      if (iframe.requestFullscreen) {
        iframe.requestFullscreen();
      }
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    const videoElement = document.querySelector('iframe')?.contentWindow?.document.querySelector('video');
    if (videoElement) {
      videoElement.muted = !videoElement.muted;
      setMuted(!muted);
    }
  };
  
  // Skip intro (jump forward 90 seconds)
  const skipIntro = () => {
    const videoElement = document.querySelector('iframe')?.contentWindow?.document.querySelector('video');
    if (videoElement) {
      videoElement.currentTime += 90;
    }
  };
  
  // Handle subtitle change
  const handleSubtitleChange = (value: string) => {
    setSelectedSubtitle(value);
    
    const iframe = document.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      // Try to communicate with the iframe to change subtitles
      // Note: This may not work due to cross-origin restrictions
      try {
        iframe.contentWindow.postMessage({
          type: 'subtitle',
          value: value === 'off' ? null : value
        }, '*');
      } catch (err) {
        console.error('Failed to set subtitles:', err);
      }
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
        src={vidsrcUrl}
        className="w-full h-full"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
      
      {/* Custom controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20 flex items-center justify-between opacity-0 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleMute}
            className="text-white hover:bg-white/20"
          >
            {muted ? <VolumeX /> : <Volume2 />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={skipIntro}
            className="text-white hover:bg-white/20 flex items-center gap-1"
          >
            <SkipForward size={16} />
            <span>Skip Intro</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Subtitles selection */}
          <Select value={selectedSubtitle} onValueChange={handleSubtitleChange}>
            <SelectTrigger className="w-[140px] bg-black/50 border-none text-white">
              <Settings size={16} className="mr-2" />
              <SelectValue placeholder="Subtitles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="off">Off</SelectItem>
              {subtitles.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {getLanguageName(lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={enterFullscreen}
            className="text-white hover:bg-white/20"
          >
            <Maximize />
          </Button>
        </div>
      </div>
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