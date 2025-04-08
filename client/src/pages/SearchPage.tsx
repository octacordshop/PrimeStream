import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Loader2, Film, Tv2 } from 'lucide-react';
import ContentCard from '@/components/home/ContentCard';
import { useToast } from '@/hooks/use-toast';

const SearchPage = () => {
  const [location] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Get search query from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const query = params.get('q');
    if (query) {
      setSearchTerm(query);
      setDebouncedSearchTerm(query);
    }
  }, [location]);
  
  // Debounce search term to avoid too many requests
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Search query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: [`/api/search?q=${debouncedSearchTerm}`],
    enabled: debouncedSearchTerm.length >= 2,
  });
  
  // Filter results based on active tab
  const filteredResults = searchResults ? searchResults.filter((item: any) => {
    if (activeTab === 'all') return true;
    return (activeTab === 'movies' && !item.seasons) || (activeTab === 'tvshows' && item.seasons);
  }) : [];
  
  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim().length < 2) {
      toast({
        title: "Search Error",
        description: "Please enter at least 2 characters to search",
        variant: "destructive"
      });
      return;
    }
    
    setDebouncedSearchTerm(searchTerm);
  };
  
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Search for Movies & TV Shows</h1>
        
        <form onSubmit={handleSearchSubmit} className="relative">
          <Input
            type="text"
            placeholder="Search by title, actor, director..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-prime-dark-light text-white px-5 py-6 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-prime-blue text-lg pr-14"
          />
          <Button 
            type="submit" 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-prime-blue hover:bg-prime-teal text-white rounded-full p-2 h-10 w-10"
          >
            <Search className="h-5 w-5" />
          </Button>
        </form>
      </div>
      
      {debouncedSearchTerm && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              {isLoading 
                ? 'Searching...' 
                : `Results for "${debouncedSearchTerm}" (${filteredResults.length})`}
            </h2>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-prime-dark-light">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="movies">Movies</TabsTrigger>
                <TabsTrigger value="tvshows">TV Shows</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-10 w-10 text-prime-blue animate-spin" />
            </div>
          ) : filteredResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredResults.map((result: any) => (
                <ContentCard 
                  key={`${result.seasons ? 'tv' : 'movie'}-${result.id}`}
                  id={result.id}
                  title={result.title}
                  poster={result.poster}
                  year={result.year}
                  rating={result.rating}
                  contentType={result.seasons ? 'tv' : 'movie'}
                  seasons={result.seasons}
                  imdbId={result.imdbId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-prime-dark-light/30 rounded-lg">
              {debouncedSearchTerm.length < 2 ? (
                <div>
                  <p className="text-prime-gray mb-2">Please enter at least 2 characters to search</p>
                </div>
              ) : (
                <div>
                  <div className="flex justify-center mb-4">
                    {activeTab === 'all' ? (
                      <div className="flex items-center space-x-2">
                        <Film className="h-8 w-8 text-prime-gray" />
                        <Tv2 className="h-8 w-8 text-prime-gray" />
                      </div>
                    ) : activeTab === 'movies' ? (
                      <Film className="h-10 w-10 text-prime-gray" />
                    ) : (
                      <Tv2 className="h-10 w-10 text-prime-gray" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-prime-gray max-w-md mx-auto">
                    We couldn't find any matches for "{debouncedSearchTerm}". 
                    Try different keywords or check for spelling errors.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {!debouncedSearchTerm && (
        <div className="text-center py-16">
          <Search className="h-16 w-16 text-prime-gray mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-semibold mb-2">Start Your Search</h2>
          <p className="text-prime-gray max-w-md mx-auto">
            Enter a title, actor, or director to find movies and TV shows
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
