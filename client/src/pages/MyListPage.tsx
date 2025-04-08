import { useState } from 'react';
import { useWatchlist } from '@/context/WatchlistContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Trash2, Search, BookmarkX } from 'lucide-react';
import VideoPlayer from '@/components/common/VideoPlayer';
import { useToast } from '@/hooks/use-toast';

const MyListPage = () => {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [activeTab, setActiveTab] = useState('all');
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const { toast } = useToast();
  
  // Filter content based on active tab
  const filteredWatchlist = watchlist.filter(item => {
    if (activeTab === 'all') return true;
    return item.mediaType === activeTab;
  });
  
  // Handle play button click
  const handlePlay = (content: any) => {
    setSelectedContent(content);
    setShowPlayer(true);
  };
  
  // Handle remove from watchlist
  const handleRemove = async (mediaType: string, mediaId: number, title: string) => {
    try {
      await removeFromWatchlist(mediaType, mediaId);
      toast({
        title: "Removed from watchlist",
        description: `${title} has been removed from your watchlist`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist. Try again later.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-prime-dark-light">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="movie">Movies</TabsTrigger>
              <TabsTrigger value="tv">TV Shows</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {filteredWatchlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredWatchlist.map((item) => (
              <div 
                key={item.id} 
                className="bg-prime-dark-light rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link href={`/${item.mediaType === 'movie' ? 'movie' : 'show'}/${item.mediaId}`}>
                  <a className="block">
                    <div className="aspect-[16/9] overflow-hidden">
                      {item.content?.poster ? (
                        <img 
                          src={item.content.poster} 
                          alt={item.content.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-prime-dark flex items-center justify-center">
                          <span className="text-prime-gray">No image</span>
                        </div>
                      )}
                    </div>
                  </a>
                </Link>
                
                <div className="p-4">
                  <Link href={`/${item.mediaType === 'movie' ? 'movie' : 'show'}/${item.mediaId}`}>
                    <a className="block">
                      <h3 className="text-lg font-semibold text-white mb-1">{item.content?.title}</h3>
                      <div className="flex items-center text-prime-gray text-sm mb-4">
                        <span>{item.content?.year}</span>
                        {item.mediaType === 'tv' && item.content?.seasons && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{item.content.seasons} Season{item.content.seasons !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </a>
                  </Link>
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="default"
                      size="sm" 
                      className="bg-prime-blue hover:bg-prime-teal text-white"
                      onClick={() => handlePlay(item)}
                    >
                      <Play className="mr-2 h-4 w-4" /> Play
                    </Button>
                    
                    <Button 
                      variant="ghost"
                      size="sm" 
                      className="text-prime-gray hover:text-white"
                      onClick={() => handleRemove(
                        item.mediaType, 
                        item.mediaId, 
                        item.content?.title
                      )}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-prime-dark-light p-6 rounded-full mb-6">
              <BookmarkX className="h-12 w-12 text-prime-gray" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your watchlist is empty</h2>
            <p className="text-prime-gray max-w-md mb-8">
              Add movies and TV shows to your watchlist to keep track of what you want to watch.
            </p>
            <Link href="/search">
              <Button className="bg-prime-blue hover:bg-prime-teal text-white">
                <Search className="mr-2 h-5 w-5" /> Find something to watch
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Video Player Modal */}
      {showPlayer && selectedContent && (
        <VideoPlayer 
          contentType={selectedContent.mediaType} 
          imdbId={selectedContent.content.imdbId}
          title={selectedContent.content.title}
          onClose={() => setShowPlayer(false)} 
        />
      )}
    </>
  );
};

export default MyListPage;
