import { Link } from 'wouter';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-prime-dark-light py-8 mt-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-6 md:mb-0">
            <Link href="/">
              <a className="text-prime-blue font-bold text-2xl">PrimeStream</a>
            </Link>
            <p className="text-prime-gray mt-2 max-w-md">
              Stream your favorite movies and TV shows anytime, anywhere. Powered by Octacord A1 Agent.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-bold mb-4">Navigate</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/">
                    <a className="text-prime-gray hover:text-white transition">Home</a>
                  </Link>
                </li>
                <li>
                  <Link href="/movie/latest">
                    <a className="text-prime-gray hover:text-white transition">Movies</a>
                  </Link>
                </li>
                <li>
                  <Link href="/show/latest">
                    <a className="text-prime-gray hover:text-white transition">TV Shows</a>
                  </Link>
                </li>
                <li>
                  <Link href="/my-list">
                    <a className="text-prime-gray hover:text-white transition">My List</a>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">Terms of Use</a>
                </li>
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">Cookie Policy</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">Help Center</a>
                </li>
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">Contact Us</a>
                </li>
                <li>
                  <a href="#" className="text-prime-gray hover:text-white transition">FAQs</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-prime-gray text-sm">© {new Date().getFullYear()} PrimeStream. All rights reserved.</p>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-prime-gray hover:text-white transition">
              <Facebook className="h-5 w-5" />
            </a>
            <a href="#" className="text-prime-gray hover:text-white transition">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="#" className="text-prime-gray hover:text-white transition">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
