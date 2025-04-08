import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Play, Plus, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/context/WatchlistContext';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/common/VideoPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import ContentCard from '@/components/home/ContentCard';

const MoviePage = () => {
  const { id } = useParams();
  const [_, setLocation] = useLocation();
  const [showPlayer, setShowPlayer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isItemInWatchlist } = useWatchlist();
  const { toast } = useToast();
  
  // Fetch movie details
  const { data: movie, isLoading, error } = useQuery({
    queryKey: [`/api/movies/${id}`],
  });
  
  // Check if in watchlist
  const isInWatchlist = movie ? isItemInWatchlist('movie', movie.id) : false;

  // Handle watchlist button click
  const handleWatchlistToggle = async () => {
    if (!movie) return;
    
    try {
      if (isInWatchlist) {
        await removeFromWatchlist('movie', movie.id);
        toast({
          title: "Removed from watchlist",
          description: `${movie.title} has been removed from your list`,
        });
      } else {
        await addToWatchlist({
          mediaType: 'movie',
          mediaId: movie.id
        });
        toast({
          title: "Added to watchlist",
          description: `${movie.title} has been added to your list`,
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
  
  // Fetch similar movies (for demo, we'll just use the latest movies)
  const { data: similarMovies } = useQuery({
    queryKey: ['/api/movies/latest'],
  });
  
  if (isLoading) {
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
  
  if (error || !movie) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="mb-4">
          <span className="inline-block p-3 rounded-full bg-prime-dark-light">
            <ArrowLeft className="h-6 w-6 text-prime-gray" />
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
        <p className="text-prime-gray mb-6">
          The movie you're looking for could not be found or might have been removed.
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
        {/* Movie Details Section */}
        <div className="flex flex-col md:flex-row gap-8">
          {/* Movie Poster */}
          <div className="md:w-1/3">
            <div className="aspect-[2/3] rounded overflow-hidden">
              {movie.poster ? (
                <img 
                  src={movie.poster} 
                  alt={movie.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                  <span className="text-prime-gray">No image available</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Movie Information */}
          <div className="md:w-2/3">
            <h1 className="text-3xl md:text-4xl font-bold">{movie.title}</h1>
            
            <div className="flex items-center text-prime-gray mt-2 mb-6">
              <span>{movie.year}</span>
              {movie.rating && (
                <>
                  <span className="mx-2">•</span>
                  <span>{movie.rating}</span>
                </>
              )}
              {movie.runtime && (
                <>
                  <span className="mx-2">•</span>
                  <span>{movie.runtime}</span>
                </>
              )}
            </div>
            
            <div className="flex space-x-4 mb-8">
              <Button 
                className="bg-prime-blue hover:bg-prime-teal text-white px-8 py-6 rounded flex items-center transition-colors"
                onClick={() => setShowPlayer(true)}
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
                {movie.plot || "No plot description available for this title."}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {movie.director && (
                <div>
                  <h3 className="text-white font-bold mb-1">Director</h3>
                  <p className="text-prime-gray">{movie.director}</p>
                </div>
              )}
              
              {movie.actors && (
                <div>
                  <h3 className="text-white font-bold mb-1">Cast</h3>
                  <p className="text-prime-gray">{movie.actors}</p>
                </div>
              )}
              
              {movie.genre && (
                <div>
                  <h3 className="text-white font-bold mb-1">Genres</h3>
                  <p className="text-prime-gray">{movie.genre}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Similar Movies Section */}
        {similarMovies && similarMovies.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar Movies</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {similarMovies
                .filter(similar => similar.id !== movie.id)
                .slice(0, 6)
                .map(similar => (
                  <ContentCard 
                    key={similar.id}
                    id={similar.id}
                    title={similar.title}
                    poster={similar.poster}
                    year={similar.year}
                    rating={similar.rating}
                    contentType="movie"
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
          contentType="movie" 
          imdbId={movie.imdbId}
          title={movie.title}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default MoviePage;
