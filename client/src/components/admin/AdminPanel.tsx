import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, 
  RefreshCcw, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminPanelProps {
  onClose?: () => void;
}

const AdminPanel = ({ onClose }: AdminPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [contentType, setContentType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [tmdbYear, setTmdbYear] = useState(new Date().getFullYear().toString());
  const [tmdbContentType, setTmdbContentType] = useState('movie');
  const [tmdbPage, setTmdbPage] = useState('1');
  const { toast } = useToast();
  
  // Get content based on type
  const getQueryKey = () => {
    if (contentType === 'movie') {
      return '/api/movies/latest';
    } else if (contentType === 'tv') {
      return '/api/tvshows/latest';
    }
    // For 'all', we'll need to combine results client-side
    return ['/api/movies/latest', '/api/tvshows/latest'];
  };
  
  // Fetch movies
  const { 
    data: movies, 
    isLoading: moviesLoading 
  } = useQuery({
    queryKey: ['/api/movies/latest'],
  });
  
  // Fetch TV shows
  const { 
    data: tvShows, 
    isLoading: tvShowsLoading 
  } = useQuery({
    queryKey: ['/api/tvshows/latest'],
  });
  
  // Fetch TMDB content by year mutation
  const fetchTmdbContentMutation = useMutation({
    mutationFn: async (params: { type: string, year: number, page: number }) => {
      const url = params.type === 'movie'
        ? `/api/admin/tmdb/movies/${params.year}?page=${params.page}`
        : `/api/admin/tmdb/tvshows/${params.year}?page=${params.page}`;
      
      return apiRequest('POST', url);
    },
    onSuccess: (response, params) => {
      response.json().then(data => {
        toast({
          title: "TMDB Content Imported",
          description: `Successfully imported ${data.processed} ${params.type}s from TMDB (year: ${params.year}, page: ${params.page}).`,
        });
        
        // Invalidate relevant queries to refresh the data
        if (params.type === 'movie') {
          queryClient.invalidateQueries({ queryKey: ['/api/movies/latest'] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['/api/tvshows/latest'] });
        }
      });
    },
    onError: (error, params) => {
      toast({
        title: "TMDB Import Failed",
        description: `Failed to import ${params.type}s from TMDB: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle TMDB content fetch
  const handleFetchTmdbContent = () => {
    const year = parseInt(tmdbYear);
    const page = parseInt(tmdbPage);
    
    if (isNaN(year) || year < 1900 || year > new Date().getFullYear()) {
      toast({
        title: "Invalid Year",
        description: "Please enter a valid year between 1900 and the current year.",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(page) || page < 1 || page > 100) {
      toast({
        title: "Invalid Page",
        description: "Please enter a valid page number between 1 and 100.",
        variant: "destructive",
      });
      return;
    }
    
    fetchTmdbContentMutation.mutate({ 
      type: tmdbContentType, 
      year, 
      page 
    });
  };
  
  // Fetch latest content mutation (from Vidsrc)
  const fetchContentMutation = useMutation({
    mutationFn: async (type: string) => {
      const url = type === 'movie' 
        ? '/api/admin/fetch/movies' 
        : '/api/admin/fetch/tvshows';
      
      return apiRequest('POST', url);
    },
    onSuccess: (response, type) => {
      response.json().then(data => {
        toast({
          title: "Content Refreshed",
          description: `Successfully fetched ${data.processed} ${type}s from Vidsrc API.`,
        });
        
        // Invalidate relevant queries to refresh the data
        if (type === 'movie') {
          queryClient.invalidateQueries({ queryKey: ['/api/movies/latest'] });
        } else {
          queryClient.invalidateQueries({ queryKey: ['/api/tvshows/latest'] });
        }
      });
    },
    onError: (error, type) => {
      toast({
        title: "Fetch Failed",
        description: `Failed to fetch ${type}s: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Feature/unfeature content mutation
  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, type, featured }: { id: number, type: string, featured: boolean }) => {
      const url = `/api/admin/${type === 'movie' ? 'movies' : 'tvshows'}/${id}`;
      return apiRequest('PATCH', url, { isFeatured: featured });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.featured ? "Content Featured" : "Content Unfeatured",
        description: `The ${variables.type} has been ${variables.featured ? 'featured' : 'unfeatured'}.`,
      });
      
      // Invalidate queries
      if (variables.type === 'movie') {
        queryClient.invalidateQueries({ queryKey: ['/api/movies/latest'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/tvshows/latest'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
    },
    onError: (_error, variables) => {
      toast({
        title: "Action Failed",
        description: `Failed to update ${variables.type} featured status.`,
        variant: "destructive",
      });
    }
  });
  
  // Visibility toggle mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, type, visible }: { id: number, type: string, visible: boolean }) => {
      const url = `/api/admin/${type === 'movie' ? 'movies' : 'tvshows'}/${id}`;
      return apiRequest('PATCH', url, { isVisible: visible });
    },
    onSuccess: (_data, variables) => {
      toast({
        title: variables.visible ? "Content Visible" : "Content Hidden",
        description: `The ${variables.type} has been ${variables.visible ? 'made visible' : 'hidden'}.`,
      });
      
      // Invalidate queries
      if (variables.type === 'movie') {
        queryClient.invalidateQueries({ queryKey: ['/api/movies/latest'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/tvshows/latest'] });
      }
    },
    onError: (_error, variables) => {
      toast({
        title: "Action Failed",
        description: `Failed to update ${variables.type} visibility.`,
        variant: "destructive",
      });
    }
  });
  
  // Delete content mutation
  const deleteContentMutation = useMutation({
    mutationFn: async ({ id, type }: { id: number, type: string }) => {
      const url = `/api/admin/${type === 'movie' ? 'movies' : 'tvshows'}/${id}`;
      return apiRequest('DELETE', url);
    },
    onSuccess: (_data, variables) => {
      toast({
        title: "Content Deleted",
        description: `The ${variables.type} has been removed.`,
      });
      
      // Invalidate queries
      if (variables.type === 'movie') {
        queryClient.invalidateQueries({ queryKey: ['/api/movies/latest'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/tvshows/latest'] });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/featured'] });
    },
    onError: (_error, variables) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete the ${variables.type}.`,
        variant: "destructive",
      });
    }
  });
  
  // Handle refresh content button
  const handleRefreshContent = (type: string) => {
    fetchContentMutation.mutate(type);
  };
  
  // Handle feature toggle
  const handleFeatureToggle = (id: number, type: string, currentValue: boolean) => {
    toggleFeatureMutation.mutate({ id, type, featured: !currentValue });
  };
  
  // Handle visibility toggle
  const handleVisibilityToggle = (id: number, type: string, currentValue: boolean) => {
    toggleVisibilityMutation.mutate({ id, type, visible: !currentValue });
  };
  
  // Handle delete content
  const handleDeleteContent = (id: number, type: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteContentMutation.mutate({ id, type });
    }
  };
  
  // Filter content based on search term
  const filteredContent = () => {
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    let results = [];
    
    if (contentType === 'movie' || contentType === 'all') {
      results = [
        ...(movies?.filter(movie => 
          movie.title.toLowerCase().includes(lowerSearchTerm) ||
          (movie.director && movie.director.toLowerCase().includes(lowerSearchTerm)) ||
          (movie.actors && movie.actors.toLowerCase().includes(lowerSearchTerm))
        ) || [])
      ];
    }
    
    if (contentType === 'tv' || contentType === 'all') {
      results = [
        ...results,
        ...(tvShows?.filter(show => 
          show.title.toLowerCase().includes(lowerSearchTerm) ||
          (show.creator && show.creator.toLowerCase().includes(lowerSearchTerm)) ||
          (show.actors && show.actors.toLowerCase().includes(lowerSearchTerm))
        ) || [])
      ];
    }
    
    return results;
  };
  
  // Get paginated content
  const paginatedContent = () => {
    const filtered = filteredContent();
    const itemsPerPage = 10;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  };
  
  // Handle keyboard events (ESC to close)
  useEffect(() => {
    if (!onClose) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  
  // Prevent scrolling of the background when shown as modal
  useEffect(() => {
    if (onClose) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'auto';
      };
    }
  }, [onClose]);

  const content = (
    <div className="bg-prime-dark-light rounded-lg w-full relative animate-fadeIn">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
          {onClose && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-prime-blue" 
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="content">
          <TabsList className="border-b border-white/10 mb-6 bg-transparent w-full justify-start">
            <TabsTrigger 
              value="content" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-prime-blue data-[state=active]:text-white text-prime-gray px-4 py-2 bg-transparent"
            >
              Content Management
            </TabsTrigger>
            <TabsTrigger 
              value="tmdb" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-prime-blue data-[state=active]:text-white text-prime-gray px-4 py-2 bg-transparent"
            >
              TMDB Import
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-prime-blue data-[state=active]:text-white text-prime-gray px-4 py-2 bg-transparent"
            >
              Analytics
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-prime-blue data-[state=active]:text-white text-prime-gray px-4 py-2 bg-transparent"
            >
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="relative w-full md:w-64">
                <Input
                  type="text"
                  placeholder="Search content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-prime-dark text-white px-4 py-2 rounded-full w-full focus:outline-none focus:ring-2 focus:ring-prime-blue"
                />
                <Search className="absolute right-3 top-2 h-5 w-5 text-prime-gray" />
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
                <Select value={contentType} onValueChange={setContentType}>
                  <SelectTrigger className="bg-prime-dark text-white px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue w-full">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent className="bg-prime-dark text-white border border-white/20">
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="tv">TV Shows</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex space-x-2">
                  <Button 
                    className="bg-prime-blue hover:bg-prime-teal text-white px-4 py-2 rounded flex items-center transition-colors"
                    onClick={() => handleRefreshContent('movie')}
                    disabled={fetchContentMutation.isPending}
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${fetchContentMutation.isPending ? 'animate-spin' : ''}`} /> 
                    Movies
                  </Button>
                  
                  <Button 
                    className="bg-prime-blue hover:bg-prime-teal text-white px-4 py-2 rounded flex items-center transition-colors"
                    onClick={() => handleRefreshContent('tv')}
                    disabled={fetchContentMutation.isPending}
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${fetchContentMutation.isPending ? 'animate-spin' : ''}`} /> 
                    TV Shows
                  </Button>
                </div>
              </div>
            </div>
            
            {(moviesLoading || tvShowsLoading) ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prime-blue"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-prime-dark text-prime-gray uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Title</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Year</th>
                        <th className="px-4 py-3">Featured</th>
                        <th className="px-4 py-3">Visible</th>
                        <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paginatedContent().length > 0 ? (
                        paginatedContent().map((item: any) => (
                          <tr key={`${item.contentType || 'movie'}-${item.id}`} className="text-white hover:bg-prime-dark transition-colors">
                            <td className="px-4 py-3 flex items-center">
                              <div className="w-12 h-12 mr-3 rounded overflow-hidden">
                                {item.poster ? (
                                  <img 
                                    src={item.poster} 
                                    alt={item.title} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-prime-dark flex items-center justify-center">
                                    <span className="text-xs text-prime-gray">No image</span>
                                  </div>
                                )}
                              </div>
                              {item.title}
                            </td>
                            <td className="px-4 py-3 text-prime-gray">
                              {item.seasons ? 'TV Show' : 'Movie'}
                            </td>
                            <td className="px-4 py-3 text-prime-gray">
                              {item.imdbId}
                            </td>
                            <td className="px-4 py-3 text-prime-gray">
                              {item.year}
                            </td>
                            <td className="px-4 py-3">
                              <Switch 
                                checked={item.isFeatured}
                                onCheckedChange={() => handleFeatureToggle(
                                  item.id, 
                                  item.seasons ? 'tv' : 'movie',
                                  item.isFeatured
                                )}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Switch 
                                checked={item.isVisible}
                                onCheckedChange={() => handleVisibilityToggle(
                                  item.id, 
                                  item.seasons ? 'tv' : 'movie',
                                  item.isVisible
                                )}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-prime-gray hover:text-white"
                                  onClick={() => {
                                    toast({
                                      title: "Edit Content",
                                      description: "Content editing is not implemented in this demo.",
                                    });
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-prime-gray hover:text-white"
                                  onClick={() => handleDeleteContent(
                                    item.id, 
                                    item.seasons ? 'tv' : 'movie',
                                    item.title
                                  )}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-prime-gray">
                            {searchTerm ? 'No content matches your search.' : 'No content available.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                  <div className="text-prime-gray">
                    Showing {paginatedContent().length} of {filteredContent().length} items
                  </div>
                  
                  {filteredContent().length > 10 && (
                    <div className="flex space-x-1">
                      <Button 
                        variant="outline"
                        size="icon"
                        className="bg-prime-dark text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-prime-blue transition-colors"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      
                      {Array.from({ 
                        length: Math.min(3, Math.ceil(filteredContent().length / 10)) 
                      }).map((_, i) => (
                        <Button 
                          key={i + 1}
                          variant={currentPage === i + 1 ? "default" : "outline"}
                          className={`${currentPage === i + 1 ? 'bg-prime-blue' : 'bg-prime-dark'} text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-prime-blue transition-colors`}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </Button>
                      ))}
                      
                      <Button 
                        variant="outline"
                        size="icon"
                        className="bg-prime-dark text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-prime-blue transition-colors"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredContent().length / 10)))}
                        disabled={currentPage === Math.ceil(filteredContent().length / 10)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tmdb" className="space-y-6">
            <div className="bg-prime-dark-darker rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Import Content from TMDB</h3>
              <p className="text-prime-gray mb-6">
                Discover and import movies or TV shows from TMDB by year. Only content that's available 
                on Vidsrc will be imported to ensure playability.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="w-full sm:w-1/4">
                  <label className="block text-prime-gray text-sm mb-1">Content Type</label>
                  <Select value={tmdbContentType} onValueChange={setTmdbContentType}>
                    <SelectTrigger className="bg-prime-dark text-white px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue w-full">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-prime-dark text-white border border-white/20">
                      <SelectItem value="movie">Movies</SelectItem>
                      <SelectItem value="tv">TV Shows</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="w-full sm:w-1/4">
                  <label className="block text-prime-gray text-sm mb-1">Release Year</label>
                  <Input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear()}
                    value={tmdbYear}
                    onChange={(e) => setTmdbYear(e.target.value)}
                    className="bg-prime-dark text-white px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue w-full"
                    placeholder="e.g. 2023"
                  />
                </div>
                
                <div className="w-full sm:w-1/4">
                  <label className="block text-prime-gray text-sm mb-1">Page Number</label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={tmdbPage}
                    onChange={(e) => setTmdbPage(e.target.value)}
                    className="bg-prime-dark text-white px-4 py-2 rounded border border-white/20 focus:outline-none focus:ring-2 focus:ring-prime-blue w-full"
                    placeholder="1-100"
                  />
                </div>
                
                <div className="w-full sm:w-1/4 flex items-end">
                  <Button 
                    className="bg-prime-blue hover:bg-prime-teal text-white px-4 py-2 rounded flex items-center justify-center transition-colors w-full"
                    onClick={handleFetchTmdbContent}
                    disabled={fetchTmdbContentMutation.isPending}
                  >
                    <RefreshCcw className={`mr-2 h-4 w-4 ${fetchTmdbContentMutation.isPending ? 'animate-spin' : ''}`} /> 
                    Import Content
                  </Button>
                </div>
              </div>
              
              {fetchTmdbContentMutation.isPending && (
                <div className="text-center py-8 border border-dashed border-prime-gray/30 rounded-lg">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-prime-blue mx-auto mb-4"></div>
                  <p className="text-prime-blue">
                    Importing content from TMDB and checking availability on Vidsrc...
                  </p>
                  <p className="text-prime-gray text-sm mt-2">
                    This may take a moment as we verify each title's availability.
                  </p>
                </div>
              )}
              
              {!fetchTmdbContentMutation.isPending && fetchTmdbContentMutation.isSuccess && (
                <div className="text-center py-8 border border-dashed border-prime-blue/30 rounded-lg bg-prime-blue/5">
                  <Check className="h-12 w-12 text-prime-blue mx-auto mb-4" />
                  <p className="text-white">
                    Content successfully imported!
                  </p>
                  <p className="text-prime-gray text-sm mt-2">
                    You can find the new content in the Content Management tab.
                  </p>
                </div>
              )}
              
              {!fetchTmdbContentMutation.isPending && fetchTmdbContentMutation.isError && (
                <div className="text-center py-8 border border-dashed border-red-500/30 rounded-lg bg-red-500/5">
                  <X className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <p className="text-white">
                    Failed to import content.
                  </p>
                  <p className="text-prime-gray text-sm mt-2">
                    Please check your API keys and try again.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-prime-gray mb-4">Analytics functionality is not available in this demo.</p>
              <div className="p-8 border border-dashed border-prime-gray/30 rounded-lg">
                <p className="text-prime-blue">Analytics visualizations would appear here</p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings">
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold mb-2">Admin Settings</h3>
              <p className="text-prime-gray mb-4">Settings functionality is not available in this demo.</p>
              <div className="p-8 border border-dashed border-prime-gray/30 rounded-lg">
                <p className="text-prime-blue">Admin configuration options would appear here</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
  
  // If rendered as a modal
  if (onClose) {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/80" onClick={onClose}></div>
        
        <div className="absolute inset-0 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="max-w-6xl w-full">
              {content}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If rendered as a page
  return content;
};

export default AdminPanel;
