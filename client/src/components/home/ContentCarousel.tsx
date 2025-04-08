import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentCard from "./ContentCard";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface ContentCarouselProps {
  title: string;
  apiEndpoint: string;
  contentType: "movie" | "tv";
  viewAllLink?: string;
}

const ContentCarousel = ({
  title,
  apiEndpoint,
  contentType,
  viewAllLink
}: ContentCarouselProps) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: [apiEndpoint],
  });
  
  // Handler for scrolling left
  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };
  
  // Handler for scrolling right
  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-8 px-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title}</h2>
          {viewAllLink && (
            <Link href={viewAllLink}>
              <a className="text-prime-blue hover:text-prime-teal transition">See All</a>
            </Link>
          )}
        </div>
        
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
            onClick={scrollLeft}
          >
            <ChevronLeft className="text-white" />
          </Button>
          
          <div 
            className="carousel flex space-x-4 overflow-x-auto pb-4 scrollbar-hide"
            ref={carouselRef}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoading && (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex-none w-48 md:w-56">
                  <div className="aspect-[2/3] rounded bg-prime-dark-light"></div>
                  <Skeleton className="h-4 w-3/4 mt-2 bg-prime-dark-light" />
                  <Skeleton className="h-3 w-1/2 mt-1 bg-prime-dark-light" />
                </div>
              ))
            )}
            
            {error && (
              <div className="flex-grow flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-prime-gray mb-2">Failed to load content</p>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="bg-prime-blue hover:bg-prime-teal text-white"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
            
            {!isLoading && !error && data?.length === 0 && (
              <div className="flex-grow flex items-center justify-center h-64">
                <p className="text-prime-gray">No content available</p>
              </div>
            )}
            
            {!isLoading && !error && data?.length > 0 && (
              data.map((item: any) => (
                <ContentCard 
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  poster={item.poster}
                  year={item.year}
                  rating={item.rating}
                  contentType={contentType}
                  seasons={item.seasons}
                  imdbId={item.imdbId}
                />
              ))
            )}
          </div>
          
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
            onClick={scrollRight}
          >
            <ChevronRight className="text-white" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ContentCarousel;
