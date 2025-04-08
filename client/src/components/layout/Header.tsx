import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Search, 
  User, 
  Menu, 
  X,
  LogOut,
  ShieldAlert 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [location, setLocation] = useLocation();
  const [searchValue, setSearchValue] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();

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
              {user?.isAdmin && (
                <Link href="/admin">
                  <a className={`transition flex items-center gap-1 ${location === '/admin' ? 'text-white' : 'text-prime-gray hover:text-prime-blue'}`}>
                    <ShieldAlert className="h-4 w-4" /> Admin
                  </a>
                </Link>
              )}
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
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white p-2 rounded-full hover:bg-prime-dark-light"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-prime-dark border-prime-dark-light">
                  <DropdownMenuLabel className="text-white">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-prime-dark-light" />
                  <DropdownMenuItem className="text-white focus:bg-prime-dark-light cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {user?.isAdmin && (
                    <DropdownMenuItem 
                      onClick={() => setLocation('/admin')}
                      className="text-white focus:bg-prime-dark-light cursor-pointer"
                    >
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => {
                      logoutMutation.mutate();
                      setLocation('/auth');
                    }}
                    className="text-white focus:bg-prime-dark-light cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white p-2 rounded-full hover:bg-prime-dark-light"
                onClick={() => setLocation('/auth')}
              >
                <User className="h-5 w-5" />
              </Button>
            )}
            
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
              {user?.isAdmin && (
                <Link href="/admin">
                  <a 
                    className={`transition flex items-center gap-1 ${location === '/admin' ? 'text-white' : 'text-prime-gray'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <ShieldAlert className="h-4 w-4" /> Admin Panel
                  </a>
                </Link>
              )}
              {!user && (
                <Link href="/auth">
                  <a 
                    className={`transition ${location === '/auth' ? 'text-white' : 'text-prime-gray'}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </a>
                </Link>
              )}
              {user && (
                <a
                  className="text-prime-gray cursor-pointer"
                  onClick={() => {
                    logoutMutation.mutate();
                    setLocation('/auth');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  Log Out
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
