import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Play, Plus, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWatchlist } from '@/context/WatchlistContext';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/common/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import ContentCard from '@/components/home/ContentCard';

const TVShowPage = () => {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedEpisode, setSelectedEpisode] = useState<{
    id: number;
    season: number;
    episode: number;
    title: string;
  } | null>(null);
  
  const { addToWatchlist, removeFromWatchlist, isItemInWatchlist } = useWatchlist();
  const { toast } = useToast();
  
  // Fetch TV show details
  const { data: tvShow, isLoading: showLoading, error: showError } = useQuery({
    queryKey: [`/api/tvshows/${id}`],
  });
  
  // Fetch episodes for selected season
  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: [`/api/tvshows/${id}/episodes?season=${selectedSeason}`],
    enabled: !!tvShow,
  });
  
  // Check if in watchlist
  const isInWatchlist = tvShow ? isItemInWatchlist('tv', tvShow.id) : false;

  // Handle watchlist button click
  const handleWatchlistToggle = async () => {
    if (!tvShow) return;
    
    try {
      if (isInWatchlist) {
        await removeFromWatchlist('tv', tvShow.id);
        toast({
          title: "Removed from watchlist",
          description: `${tvShow.title} has been removed from your list`,
        });
      } else {
        await addToWatchlist({
          mediaType: 'tv',
          mediaId: tvShow.id
        });
        toast({
          title: "Added to watchlist",
          description: `${tvShow.title} has been added to your list`,
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
  
  // Handle season change
  const handleSeasonChange = (value: string) => {
    setSelectedSeason(parseInt(value));
  };
  
  // Handle play button for entire show
  const handlePlayShow = () => {
    setSelectedEpisode(null);
    setShowPlayer(true);
  };
  
  // Handle play button for specific episode
  const handlePlayEpisode = (episode: any) => {
    setSelectedEpisode(episode);
    setShowPlayer(true);
  };
  
  // Fetch similar shows (for demo, we'll just use the latest shows)
  const { data: similarShows } = useQuery({
    queryKey: ['/api/tvshows/latest'],
  });
  
  if (showLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="md:w-1/3">
            <Skeleton className="aspect-[2/3] w-full rounded bg-prime-dark-light" />
          </div>
          <div className="md:w-2/3 space-y-4">
            <Skeleton className="h-10 w-3/4 bg-prime-dark-light" />
            <Skeleton className="h-6 w-1/2 bg-prime-dark-light" />
            <div className="flex space-x-4 py-4">
              <Skeleton className="h-12 w-32 bg-prime-dark-light" />
              <Skeleton className="h-12 w-32 bg-prime-dark-light" />
            </div>
            <Skeleton className="h-32 w-full bg-prime-dark-light" />
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-24 w-full bg-prime-dark-light" />
              <Skeleton className="h-24 w-full bg-prime-dark-light" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (showError || !tvShow) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="mb-4">
          <span className="inline-block p-3 rounded-full bg-prime-dark-light">
            <ArrowLeft className="h-6 w-6 text-prime-gray" />
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-4">TV Show Not Found</h1>
        <p className="text-prime-gray mb-6">
          The TV show you're looking for could not be found or might have been removed.
        </p>
        <Button 
          variant="default" 
          className="bg-prime-blue hover:bg-prime-teal text-white"
          onClick={() => setLocation('/')}
        >
          Return Home
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        {/* TV Show Details Section */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Show Poster */}
          <div className="md:w-1/3">
            <div className="aspect-[2/3] rounded overflow-hidden">
              {tvShow.poster ? (
                <img 
                  src={tvShow.poster} 
                  alt={tvShow.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                  <span className="text-prime-gray">No image available</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Show Information */}
          <div className="md:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold">{tvShow.title}</h1>
            
            <div className="flex items-center text-prime-gray mt-2 mb-6">
              <span>{tvShow.year}</span>
              {tvShow.rating && (
                <>
                  <span className="mx-2">•</span>
                  <span>{tvShow.rating}</span>
                </>
              )}
              {tvShow.seasons && (
                <>
                  <span className="mx-2">•</span>
                  <span>{tvShow.seasons} Season{tvShow.seasons !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-4 mb-8">
              <Button 
                className="bg-prime-blue hover:bg-prime-teal text-white px-8 py-6 rounded flex items-center transition-colors"
                onClick={handlePlayShow}
              >
                <Play className="mr-2 h-5 w-5" /> Watch Now
              </Button>
              
              <Button 
                className="bg-prime-dark-light hover:bg-gray-700 border border-white/20 text-white px-8 py-6 rounded flex items-center transition-colors"
                onClick={handleWatchlistToggle}
              >
                {isInWatchlist ? (
                  <>
                    <Check className="mr-2 h-5 w-5" /> In My List
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" /> Add to My List
                  </>
                )}
              </Button>
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-2">Overview</h2>
              <p className="text-prime-gray">
                {tvShow.plot || "No plot description available for this title."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tvShow.creator && (
                <div>
                  <h3 className="text-white font-bold mb-1">Creator</h3>
                  <p className="text-prime-gray">{tvShow.creator}</p>
                </div>
              )}
              
              {tvShow.actors && (
                <div>
                  <h3 className="text-white font-bold mb-1">Cast</h3>
                  <p className="text-prime-gray">{tvShow.actors}</p>
                </div>
              )}
              
              {tvShow.genre && (
                <div>
                  <h3 className="text-white font-bold mb-1">Genres</h3>
                  <p className="text-prime-gray">{tvShow.genre}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Episodes Section */}
        {tvShow.seasons && tvShow.seasons > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Episodes</h2>
            
            <div className="space-y-6">
              {/* Season selector */}
              <div className="max-w-xs">
                <Select
                  value={selectedSeason.toString()}
                  onValueChange={handleSeasonChange}
                >
                  <SelectTrigger className="w-full bg-prime-dark text-white px-4 py-3 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue">
                    <SelectValue placeholder={`Season ${selectedSeason}`} />
                  </SelectTrigger>
                  <SelectContent className="bg-prime-dark text-white border border-white/20">
                    {Array.from({ length: tvShow.seasons }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()} className="cursor-pointer">
                        Season {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Episodes list */}
              <div className="space-y-4">
                {episodesLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-prime-blue"></div>
                  </div>
                ) : episodes && episodes.length > 0 ? (
                  episodes.map((episode: any) => (
                    <div 
                      key={episode.id} 
                      className="flex flex-col sm:flex-row gap-4 border-b border-white/10 pb-4"
                    >
                      <div className="sm:w-48 h-28 flex-shrink-0 rounded overflow-hidden">
                        {episode.poster ? (
                          <img 
                            src={episode.poster} 
                            alt={`Episode ${episode.episode}`} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                            <span className="text-prime-gray text-sm">No image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="text-white font-medium">
                            {episode.episode}. {episode.title}
                          </h3>
                          {episode.runtime && (
                            <span className="text-prime-gray text-sm">{episode.runtime}</span>
                          )}
                        </div>
                        <p className="text-prime-gray text-sm my-2">
                          {episode.plot || 'No description available for this episode.'}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-prime-blue hover:bg-prime-teal text-white"
                          onClick={() => handlePlayEpisode(episode)}
                        >
                          <Play className="mr-2 h-4 w-4" /> Play
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 bg-prime-dark-light/40 rounded">
                    <p className="text-prime-gray">No episodes found for Season {selectedSeason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Similar Shows Section */}
        {similarShows && similarShows.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar TV Shows</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarShows
                .filter(similar => similar.id !== tvShow.id)
                .slice(0, 6)
                .map(similar => (
                  <ContentCard 
                    key={similar.id}
                    id={similar.id}
                    title={similar.title}
                    poster={similar.poster}
                    year={similar.year}
                    rating={similar.rating}
                    contentType="tv"
                    seasons={similar.seasons}
                    imdbId={similar.imdbId}
                  />
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer 
          contentType="tv" 
          imdbId={tvShow.imdbId}
          title={tvShow.title}
          season={selectedEpisode?.season}
          episode={selectedEpisode?.episode}
          episodeId={selectedEpisode?.id}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default TVShowPage;
