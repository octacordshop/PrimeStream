import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ChevronLeft, Info, Calendar, Star, Clock, Play, Share2, Plus, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import VideoPlayer from '@/components/common/VideoPlayer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWatchlist } from '@/context/WatchlistContext';

export default function WatchPage() {
  const [_, setLocation] = useLocation();
  const [match, params] = useRoute('/watch/:mediaType/:id');
  const [activeTab, setActiveTab] = useState<string>('info');
  const { toast } = useToast();
  const watchlistContext = useWatchlist();
  
  // Extract parameters
  const mediaType = params?.mediaType as 'movie' | 'tv';
  const contentId = params?.id;

  // For TV shows, we need season and episode
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<number>(1);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<number | undefined>(undefined);
  const [selectedEpisodeData, setSelectedEpisodeData] = useState<any>(null);
  
  // Check if content is in watchlist
  const inWatchlist = contentId && watchlistContext ? watchlistContext.isItemInWatchlist(mediaType, parseInt(contentId)) : false;
  
  // Fetch content details
  const { data: content, isLoading: contentLoading, error: contentError } = useQuery({
    queryKey: [`/api/${mediaType === 'movie' ? 'movies' : 'tvshows'}/${contentId}`],
    enabled: !!contentId && !!mediaType,
  });
  
  // For TV shows, fetch episodes
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: [`/api/tvshows/${contentId}/episodes`, { season: selectedSeason }],
    enabled: !!contentId && mediaType === 'tv',
  });
  
  // Update selected episode when episodes load or season changes
  useEffect(() => {
    if (episodes && episodes.length > 0) {
      // Default to first episode of season
      setSelectedEpisode(episodes[0].episode);
      setSelectedEpisodeId(episodes[0].id);
      setSelectedEpisodeData(episodes[0]);
    }
  }, [episodes, selectedSeason]);
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    if (!content || !watchlistContext) return;
    
    try {
      if (inWatchlist) {
        await watchlistContext.removeFromWatchlist(mediaType, content.id);
        toast({
          title: 'Removed from watchlist',
          description: `${content.title} has been removed from your watchlist`,
        });
      } else {
        await watchlistContext.addToWatchlist({ mediaType, mediaId: content.id });
        toast({
          title: 'Added to watchlist',
          description: `${content.title} has been added to your watchlist`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not update watchlist',
        variant: 'destructive',
      });
    }
  };
  
  // Handle go back
  const handleGoBack = () => {
    if (mediaType === 'movie') {
      setLocation(`/movie/${contentId}`);
    } else {
      setLocation(`/show/${contentId}`);
    }
  };
  
  // Handle episode selection
  const handleEpisodeSelect = (episode: any) => {
    setSelectedEpisode(episode.episode);
    setSelectedEpisodeId(episode.id);
    setSelectedEpisodeData(episode);
    // Reset tab to info
    setActiveTab('info');
  };
  
  if (contentLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="mr-2">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-8">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    );
  }
  
  if (contentError || !content) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load content. Please try again later.
          </AlertDescription>
        </Alert>
        <Button onClick={() => setLocation('/')}>Go Home</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="hover:bg-gray-800">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-2xl font-bold">{content.title}</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleWatchlistToggle}
            className="hover:bg-gray-800"
          >
            {inWatchlist ? (
              <Check className="h-5 w-5 text-primary" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: 'Link copied',
                description: 'Content link copied to clipboard',
              });
            }}
            className="hover:bg-gray-800"
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Full screen video player */}
      <div className="mb-8 w-full max-w-5xl mx-auto">
        <VideoPlayer 
          mediaType={mediaType}
          imdbId={content.imdbId}
          title={content.title}
          season={selectedSeason}
          episode={selectedEpisode}
          episodeId={selectedEpisodeId}
          onClose={handleGoBack}
          autoPlay={true}
        />
      </div>
      
      {/* TV Show season/episode selector */}
      {mediaType === 'tv' && (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Season selector */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Season</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: content.seasons || 1 }, (_, i) => i + 1).map((season) => (
                  <Button
                    key={season}
                    variant={selectedSeason === season ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSeason(season)}
                  >
                    {season}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Episode selector */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Episode</h3>
              {episodesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : episodes && episodes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {episodes.map((ep) => (
                    <Button
                      key={ep.id}
                      variant={selectedEpisode === ep.episode ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleEpisodeSelect(ep)}
                      className="text-xs"
                    >
                      {ep.episode}. {ep.title.length > 12 ? ep.title.substring(0, 12) + '...' : ep.title}
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>No episodes found</AlertTitle>
                  <AlertDescription>
                    We couldn't find any episodes for this season.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Content information tabs */}
      <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="info" className="flex items-center gap-1">
            <Info className="h-4 w-4" />
            <span>Info</span>
          </TabsTrigger>
          {mediaType === 'tv' && selectedEpisodeData && (
            <TabsTrigger value="episode" className="flex items-center gap-1">
              <Play className="h-4 w-4" />
              <span>Episode</span>
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="info" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="md:col-span-1">
              <img 
                src={content.poster || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                alt={content.title}
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            
            {/* Content details */}
            <div className="md:col-span-2 space-y-4">
              <h2 className="text-3xl font-bold">{content.title}</h2>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-300">
                {content.year && (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{content.year}</span>
                  </div>
                )}
                
                {content.rating && (
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-400" />
                    <span>{content.rating}</span>
                  </div>
                )}
                
                {content.runtime && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{content.runtime}</span>
                  </div>
                )}
                
                {mediaType === 'tv' && content.seasons && (
                  <div>
                    <span>{content.seasons} Season{content.seasons !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              {content.plot && (
                <div>
                  <h3 className="font-semibold mb-1">Synopsis</h3>
                  <p className="text-gray-300">{content.plot}</p>
                </div>
              )}
              
              {((mediaType === 'movie' && content.director) || (mediaType === 'tv' && content.creator)) && (
                <div>
                  <h3 className="font-semibold mb-1">{mediaType === 'movie' ? 'Director' : 'Creator'}</h3>
                  <p className="text-gray-300">{mediaType === 'movie' ? content.director : content.creator}</p>
                </div>
              )}
              
              {content.actors && (
                <div>
                  <h3 className="font-semibold mb-1">Cast</h3>
                  <p className="text-gray-300">{content.actors}</p>
                </div>
              )}
              
              {content.genre && (
                <div>
                  <h3 className="font-semibold mb-1">Genre</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.genre.split(',').map((genre, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-800 rounded-md text-xs text-gray-200"
                      >
                        {genre.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        {mediaType === 'tv' && selectedEpisodeData && (
          <TabsContent value="episode" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">
                  S{selectedSeason} E{selectedEpisode}: {selectedEpisodeData.title}
                </h3>
                {selectedEpisodeData.airDate && (
                  <div className="flex items-center text-sm text-gray-300">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>{selectedEpisodeData.airDate}</span>
                  </div>
                )}
              </div>
              
              {selectedEpisodeData.plot && (
                <p className="text-gray-300">{selectedEpisodeData.plot}</p>
              )}
              
              {selectedEpisodeData.poster && (
                <img
                  src={selectedEpisodeData.poster}
                  alt={selectedEpisodeData.title}
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}