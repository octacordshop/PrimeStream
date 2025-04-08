import { useState } from 'react';
import HeroBanner from '@/components/home/HeroBanner';
import ContentCarousel from '@/components/home/ContentCarousel';
import { Button } from '@/components/ui/button';
import { useWatchlist } from '@/context/WatchlistContext';
import { useRecentlyWatched } from '@/context/RecentlyWatchedContext';
import { Plus } from 'lucide-react';
import { Link } from 'wouter';

const HomePage = () => {
  const { watchlist } = useWatchlist();
  const { recentlyWatched } = useRecentlyWatched();
  
  return (
    <div className="flex flex-col">
      {/* Hero Banner with featured content */}
      <HeroBanner />
      
      {/* Latest Movies Carousel */}
      <ContentCarousel 
        title="Latest Movies" 
        apiEndpoint="/api/movies/latest" 
        contentType="movie"
        viewAllLink="/movie/latest"
      />
      
      {/* Popular TV Shows Carousel */}
      <ContentCarousel 
        title="Popular TV Shows" 
        apiEndpoint="/api/tvshows/latest" 
        contentType="tv"
        viewAllLink="/show/latest"
      />
      
      {/* Recently Watched Section - only show if there are items */}
      {recentlyWatched.length > 0 && (
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Recently Watched</h2>
              <Link href="/recently-watched">
                <a className="text-prime-blue hover:text-prime-teal transition">See All</a>
              </Link>
            </div>
            
            <div className="relative group">
              <div className="carousel flex space-x-4 overflow-x-auto pb-4">
                {recentlyWatched.map((item) => (
                  <div key={item.id} className="flex-none w-48 md:w-56 card-hover transition-transform duration-300 relative">
                    <Link href={`/${item.mediaType === 'movie' ? 'movie' : 'show'}/${item.mediaId}`}>
                      <a className="block">
                        <div className="aspect-[2/3] rounded overflow-hidden">
                          {item.content?.poster ? (
                            <img 
                              src={item.content.poster} 
                              alt={item.content.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                              <span className="text-prime-gray">No image</span>
                            </div>
                          )}
                        </div>
                        <h3 className="mt-2 text-white font-medium">{item.content?.title}</h3>
                        <div className="flex items-center text-prime-gray text-sm mt-1">
                          <span>{item.content?.year}</span>
                          {item.episode && (
                            <>
                              <span className="mx-2">•</span>
                              <span>S{item.episode.season} E{item.episode.episode}</span>
                            </>
                          )}
                        </div>
                      </a>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* My List Section - only show if there are items */}
      {watchlist.length > 0 && (
        <section className="py-8 px-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My List</h2>
              <Link href="/my-list">
                <a className="text-prime-blue hover:text-prime-teal transition">See All</a>
              </Link>
            </div>
            
            <div className="relative group">
              <div className="carousel flex space-x-4 overflow-x-auto pb-4">
                {watchlist.map((item) => (
                  <div key={item.id} className="flex-none w-48 md:w-56 card-hover transition-transform duration-300 relative">
                    <Link href={`/${item.mediaType === 'movie' ? 'movie' : 'show'}/${item.mediaId}`}>
                      <a className="block">
                        <div className="aspect-[2/3] rounded overflow-hidden">
                          {item.content?.poster ? (
                            <img 
                              src={item.content.poster} 
                              alt={item.content.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-prime-dark-light flex items-center justify-center">
                              <span className="text-prime-gray">No image</span>
                            </div>
                          )}
                        </div>
                        <h3 className="mt-2 text-white font-medium">{item.content?.title}</h3>
                        <div className="flex items-center text-prime-gray text-sm mt-1">
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
                  </div>
                ))}
                
                <div className="flex-none w-48 md:w-56 flex items-center justify-center border-2 border-dashed border-prime-gray rounded">
                  <Link href="/search">
                    <a className="text-center p-4">
                      <Plus className="text-prime-gray text-3xl mx-auto mb-2" />
                      <p className="text-prime-gray">Add to your watchlist</p>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;
