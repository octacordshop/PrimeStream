import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Play, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/common/VideoPlayer';
import { useWatchlist } from '@/context/WatchlistContext';
import { Link } from 'wouter';

type FeaturedContent = {
  featured: {
    id: number;
    title: string;
    imdbId: string;
    plot?: string;
    year?: number | string;
    rating?: string;
  } | null;
  type: 'movie' | 'tv' | null;
};

const HeroBanner = () => {
  const [showPlayer, setShowPlayer] = useState(false);
  const { toast } = useToast();
  const watchlistContext = useWatchlist();
  
  const { data: featuredContent, isLoading, error } = useQuery<FeaturedContent>({
    queryKey: ['/api/featured'],
  });
  
  const handleAddToWatchlist = async () => {
    if (!featuredContent?.featured || !watchlistContext) return;
    
    try {
      await watchlistContext.addToWatchlist({
        mediaType: featuredContent.type!,
        mediaId: featuredContent.featured.id
      });
      
      toast({
        title: "Added to watchlist",
        description: `${featuredContent.featured.title} has been added to your list`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add to watchlist. Try again later.",
        variant: "destructive"
      });
    }
  };
  
  const isInWatchlist = featuredContent?.featured && watchlistContext
    ? watchlistContext.isItemInWatchlist(featuredContent.type!, featuredContent.featured.id) 
    : false;

  if (isLoading) {
    return (
      <section className="relative h-[70vh] md:h-[80vh] w-full bg-prime-dark-light animate-pulse">
        <div className="absolute bottom-0 left-0 z-20 p-8 md:p-16 w-full md:w-1/2">
          <div className="h-8 w-32 bg-gray-700 rounded mb-4"></div>
          <div className="h-10 w-3/4 bg-gray-700 rounded mb-4"></div>
          <div className="h-24 w-full bg-gray-700 rounded mb-6"></div>
          <div className="flex space-x-4">
            <div className="h-12 w-32 bg-gray-700 rounded"></div>
            <div className="h-12 w-32 bg-gray-700 rounded"></div>
          </div>
        </div>
      </section>
    );
  }
  
  if (error || !featuredContent?.featured) {
    return (
      <section className="relative h-[50vh] w-full bg-prime-dark-light">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl text-white font-bold mb-4">Featured Content Unavailable</h1>
            <p className="text-prime-gray mb-6">
              We're unable to load the featured content at this time. Please try again later.
            </p>
            <Button 
              variant="default" 
              onClick={() => window.location.reload()}
              className="bg-prime-blue hover:bg-prime-teal text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <>
      <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-10">
          <img 
            src={featuredContent.featured.poster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-1.2.1&auto=format&fit=crop&w=2000&q=80'}
            alt={featuredContent.featured.title}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-prime-dark via-prime-dark/70 to-transparent"></div>
        </div>
        
        {/* Content */}
        <div className="absolute bottom-0 left-0 z-20 p-8 md:p-16 w-full md:w-1/2">
          <div className="mb-4">
            <span className="bg-prime-blue text-white px-2 py-1 text-xs rounded">
              {featuredContent.type === 'movie' ? 'PRIME MOVIE' : 'PRIME SERIES'}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {featuredContent.featured.title}
          </h1>
          
          <p className="text-prime-gray mb-6 text-sm md:text-base">
            {featuredContent.featured.plot || 'No description available for this title.'}
          </p>
          
          <div className="flex space-x-4">
            <Button 
              className="bg-prime-blue hover:bg-prime-teal text-white px-8 py-3 rounded flex items-center transition-colors"
              onClick={() => setShowPlayer(true)}
            >
              <Play className="mr-2 h-5 w-5" /> Watch Now
            </Button>
            
            {!isInWatchlist ? (
              <Button 
                className="bg-prime-dark-light hover:bg-gray-700 text-white px-8 py-3 rounded flex items-center transition-colors"
                onClick={handleAddToWatchlist}
              >
                <Plus className="mr-2 h-5 w-5" /> My List
              </Button>
            ) : (
              <Link href="/my-list">
                <Button className="bg-prime-dark-light hover:bg-gray-700 text-white px-8 py-3 rounded flex items-center transition-colors">
                  View in My List
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
      
      {/* Video Player Modal */}
      {showPlayer && (
        <VideoPlayer 
          mediaType={featuredContent.type!} 
          imdbId={featuredContent.featured.imdbId}
          title={featuredContent.featured.title}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default HeroBanner;
