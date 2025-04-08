import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Search, 
  User, 
  Menu, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const Header = () => {
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue('');
    } else {
      toast({
        title: "Search Error",
        description: "Please enter a search term",
        variant: "destructive"
      });
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`sticky top-0 z-50 transition-colors duration-300 ${
      isScrolled ? 'bg-prime-dark shadow-lg' : 'bg-prime-dark bg-opacity-90'
    }`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <a className="flex items-center">
                <span className="text-prime-blue font-bold text-2xl">PrimeStream</span>
              </a>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/">
                <a className={`transition ${location === '/' ? 'text-white' : 'text-prime-gray hover:text-prime-blue'}`}>
                  Home
                </a>
              </Link>
              <Link href="/movie/latest">
                <a className={`transition ${location.startsWith('/movie') ? 'text-white' : 'text-prime-gray hover:text-prime-blue'}`}>
                  Movies
                </a>
              </Link>
              <Link href="/show/latest">
                <a className={`transition ${location.startsWith('/show') ? 'text-white' : 'text-prime-gray hover:text-prime-blue'}`}>
                  TV Shows
                </a>
              </Link>
              <Link href="/my-list">
                <a className={`transition ${location === '/my-list' ? 'text-white' : 'text-prime-gray hover:text-prime-blue'}`}>
                  My List
                </a>
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <form onSubmit={handleSearchSubmit}>
                <Input
                  type="text"
                  placeholder="Search"
                  className="bg-prime-dark-light text-white px-4 py-2 rounded-full w-64 focus:outline-none focus:ring-2 focus:ring-prime-blue"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
                <Button 
                  type="submit" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-prime-gray hover:text-white"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </form>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white p-2 rounded-full hover:bg-prime-dark-light md:hidden"
              onClick={() => setLocation('/search')}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white p-2 rounded-full hover:bg-prime-dark-light"
              onClick={() => toast({
                title: "User Menu",
                description: "User authentication not implemented in this demo",
              })}
            >
              <User className="h-5 w-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden text-white p-2 rounded-full hover:bg-prime-dark-light"
              onClick={toggleMobileMenu}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-prime-dark-light mt-3">
            <nav className="flex flex-col space-y-4">
              <Link href="/">
                <a 
                  className={`transition ${location === '/' ? 'text-white' : 'text-prime-gray'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Home
                </a>
              </Link>
              <Link href="/movie/latest">
                <a 
                  className={`transition ${location.startsWith('/movie') ? 'text-white' : 'text-prime-gray'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Movies
                </a>
              </Link>
              <Link href="/show/latest">
                <a 
                  className={`transition ${location.startsWith('/show') ? 'text-white' : 'text-prime-gray'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  TV Shows
                </a>
              </Link>
              <Link href="/my-list">
                <a 
                  className={`transition ${location === '/my-list' ? 'text-white' : 'text-prime-gray'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My List
                </a>
              </Link>
              <Link href="/admin">
                <a 
                  className={`transition ${location === '/admin' ? 'text-white' : 'text-prime-gray'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </a>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
