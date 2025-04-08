import { useState } from "react";
import { Link } from "wouter";
import { Plus, Check, Play } from "lucide-react";
import { useWatchlist } from "@/context/WatchlistContext";
import { useToast } from "@/hooks/use-toast";
import VideoPlayer from "@/components/common/VideoPlayer";

interface ContentCardProps {
  id: number;
  title: string;
  poster: string;
  year: number | string;
  rating?: string;
  contentType: "movie" | "tv";
  seasons?: number;
  imdbId: string;
}

const ContentCard = ({
  id,
  title,
  poster,
  year,
  rating,
  contentType,
  seasons,
  imdbId
}: ContentCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isItemInWatchlist } = useWatchlist();
  const isInWatchlist = isItemInWatchlist(contentType, id);
  const { toast } = useToast();

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isInWatchlist) {
        await removeFromWatchlist(contentType, id);
        toast({
          title: "Removed from watchlist",
          description: `${title} has been removed from your list`,
        });
      } else {
        await addToWatchlist({
          mediaType: contentType,
          mediaId: id
        });
        toast({
          title: "Added to watchlist",
          description: `${title} has been added to your list`,
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

  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPlayer(true);
  };

  return (
    <>
      <div 
        className="flex-none w-48 md:w-56 card-hover transition-transform duration-300 relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link href={`/${contentType === 'movie' ? 'movie' : 'show'}/${id}`}>
          <a className="block">
            <div className="aspect-[2/3] rounded overflow-hidden">
              {poster ? (
                <img 
                  src={poster} 
                  alt={title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                  <span className="text-prime-gray">No image</span>
                </div>
              )}
            </div>
            <h3 className="mt-2 text-white font-medium">{title}</h3>
            <div className="flex items-center text-prime-gray text-sm mt-1">
              <span>{year}</span>
              {rating && (
                <>
                  <span className="mx-2">•</span>
                  <span>{rating}</span>
                </>
              )}
              {contentType === 'tv' && seasons && (
                <>
                  <span className="mx-2">•</span>
                  <span>{seasons} Season{seasons !== 1 ? 's' : ''}</span>
                </>
              )}
            </div>
          </a>
        </Link>
        
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-60 rounded flex items-center justify-center opacity-100 transition-opacity duration-300">
            <div className="flex flex-col items-center space-y-4">
              <button 
                onClick={handlePlayClick}
                className="bg-prime-blue hover:bg-prime-teal text-white rounded-full p-3 transition-colors"
              >
                <Play className="h-6 w-6" />
              </button>
              <button 
                onClick={handleWatchlistClick}
                className={`bg-prime-dark-light/80 hover:bg-prime-teal/80 text-white rounded-full p-3 transition-colors`}
              >
                {isInWatchlist ? <Check className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
              </button>
            </div>
          </div>
        )}
        
        {/* Always visible watchlist button for mobile */}
        <button 
          onClick={handleWatchlistClick}
          className="md:hidden absolute bottom-12 right-2 bg-prime-dark-light/80 rounded-full p-1 hover:bg-prime-teal/80 transition-colors"
        >
          {isInWatchlist ? (
            <Check className="text-white h-4 w-4" />
          ) : (
            <Plus className="text-white h-4 w-4" />
          )}
        </button>
      </div>
      
      {showPlayer && (
        <VideoPlayer 
          contentType={contentType} 
          imdbId={imdbId}
          title={title}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default ContentCard;
