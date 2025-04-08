import { useState, useEffect } from 'react';
import { X, Play, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { useWatchlist } from '@/context/WatchlistContext';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/common/VideoPlayer';

interface ContentDetailsModalProps {
  contentType: 'movie' | 'tv';
  contentId: number;
  onClose: () => void;
}

const ContentDetailsModal = ({
  contentType,
  contentId,
  onClose
}: ContentDetailsModalProps) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    id: number;
    season: number;
    episode: number;
    title: string;
  } | null>(null);
  
  const { addToWatchlist, removeFromWatchlist, isItemInWatchlist } = useWatchlist();
  const { toast } = useToast();
  
  // Fetch content details
  const { data: content, isLoading: contentLoading } = useQuery({
    queryKey: [`/api/${contentType === 'movie' ? 'movies' : 'tvshows'}/${contentId}`],
  });
  
  // Fetch episodes if it's a TV show
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: [`/api/tvshows/${contentId}/episodes?season=${selectedSeason}`],
    enabled: contentType === 'tv',
  });
  
  // Check if in watchlist
  const isInWatchlist = isItemInWatchlist(contentType, contentId);
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    try {
      if (isInWatchlist) {
        await removeFromWatchlist(contentType, contentId);
        toast({
          title: "Removed from watchlist",
          description: `${content?.title} has been removed from your list`,
        });
      } else {
        await addToWatchlist({
          mediaType: contentType,
          mediaId: contentId
        });
        toast({
          title: "Added to watchlist",
          description: `${content?.title} has been added to your list`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist. Try again later.",
        variant: "destructive"
      });
    }
  };
  
  // Handle play button click
  const handlePlay = (episodeData?: any) => {
    if (episodeData) {
      setSelectedEpisode(episodeData);
    } else {
      setSelectedEpisode(null);
    }
    setShowPlayer(true);
  };
  
  // Handle season change
  const handleSeasonChange = (value: string) => {
    setSelectedSeason(parseInt(value));
  };
  
  // Close on ESC key
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
  
  if (contentLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        <div className="bg-prime-dark-light rounded-lg max-w-4xl w-full h-96 relative animate-fadeIn flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prime-blue"></div>
        </div>
      </div>
    );
  }
  
  if (!content) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        <div className="bg-prime-dark-light rounded-lg max-w-4xl w-full relative animate-fadeIn p-8">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 text-white z-10 p-1 hover:bg-prime-dark rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">Content Not Found</h2>
            <p className="text-prime-gray">We couldn't load this content. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-prime-dark-light rounded-lg max-w-4xl w-full relative animate-fadeIn">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-white z-10 p-1 hover:bg-prime-dark rounded-full"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Header image */}
              <div className="h-[300px] relative">
                <img 
                  src={content.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'}
                  alt={content.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-prime-dark via-prime-dark/50 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 p-6">
                  <h1 className="text-3xl font-bold">{content.title}</h1>
                  <div className="flex items-center text-prime-gray mt-2">
                    <span>{content.year}</span>
                    {content.rating && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{content.rating}</span>
                      </>
                    )}
                    {contentType === 'tv' && content.seasons && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{content.seasons} Season{content.seasons !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Details */}
              <div className="p-6">
                <div className="flex space-x-4 mb-6">
                  <Button 
                    className="bg-prime-blue hover:bg-prime-teal text-white px-6 py-2 rounded flex items-center transition-colors"
                    onClick={() => handlePlay()}
                  >
                    <Play className="mr-2 h-5 w-5" /> Play
                  </Button>
                  
                  <Button 
                    className="bg-prime-dark-light hover:bg-gray-700 border border-white/20 text-white px-6 py-2 rounded flex items-center transition-colors"
                    onClick={handleWatchlistToggle}
                  >
                    {isInWatchlist ? (
                      <>
                        <Check className="mr-2 h-5 w-5" /> In My List
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" /> My List
                      </>
                    )}
                  </Button>
                </div>
                
                <p className="text-white mb-6">
                  {content.plot || 'No plot description available for this title.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {content.actors && (
                    <div>
                      <h3 className="text-white font-bold mb-2">Cast</h3>
                      <p className="text-prime-gray">{content.actors}</p>
                    </div>
                  )}
                  
                  {content.genre && (
                    <div>
                      <h3 className="text-white font-bold mb-2">Genres</h3>
                      <p className="text-prime-gray">{content.genre}</p>
                    </div>
                  )}
                </div>
                
                {/* Seasons/Episodes for TV Shows */}
                {contentType === 'tv' && (
                  <div className="mt-8">
                    <h3 className="text-white font-bold mb-4">Seasons</h3>
                    
                    <div className="space-y-4">
                      {/* Seasons dropdown */}
                      <div className="relative">
                        <Select
                          value={selectedSeason.toString()}
                          onValueChange={handleSeasonChange}
                        >
                          <SelectTrigger className="w-full bg-prime-dark text-white px-4 py-3 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue">
                            <SelectValue placeholder="Select Season" />
                          </SelectTrigger>
                          <SelectContent className="bg-prime-dark text-white border border-white/20">
                            {content.seasons && Array.from({ length: content.seasons }, (_, i) => (
                              <SelectItem key={i + 1} value={(i + 1).toString()}>
                                Season {i + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Episodes list */}
                      {episodesLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prime-blue"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {episodes && episodes.length > 0 ? (
                            episodes.map((episode: any) => (
                              <div key={episode.id} className="flex border-b border-white/10 pb-3">
                                <div className="w-24 h-16 flex-shrink-0 rounded overflow-hidden">
                                  {episode.poster ? (
                                    <img 
                                      src={episode.poster} 
                                      alt={`Episode ${episode.episode}`} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                                      <span className="text-xs text-prime-gray">No image</span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4 flex-grow">
                                  <div className="flex justify-between">
                                    <h4 className="text-white font-medium">
                                      {episode.episode}. {episode.title}
                                    </h4>
                                    {episode.runtime && (
                                      <span className="text-prime-gray text-sm">{episode.runtime}</span>
                                    )}
                                  </div>
                                  <p className="text-prime-gray text-sm line-clamp-2 mt-1">
                                    {episode.plot || 'No description available for this episode.'}
                                  </p>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-prime-blue hover:text-prime-teal p-0 mt-1 h-auto"
                                    onClick={() => handlePlay(episode)}
                                  >
                                    Play Episode
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-prime-gray">No episodes found for this season</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer 
          contentType={contentType} 
          imdbId={content.imdbId}
          title={content.title}
          season={selectedEpisode?.season}
          episode={selectedEpisode?.episode}
          episodeId={selectedEpisode?.id}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default ContentDetailsModal;
