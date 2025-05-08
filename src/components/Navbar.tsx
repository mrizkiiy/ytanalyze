'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const insightsRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const insightsItems = [
    { name: 'Keyword Analysis', href: '/analysis' },
    { name: 'Keyword Research', href: '/keywords' },
    { name: 'Growth & AI Predictions', href: '/growth' },
    { name: 'Google Trends', href: '/google-trends' }
  ];

  const navigation = [
    { name: 'Dashboard', href: '/' },
    { name: 'Help', href: '/help' },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (insightsRef.current && !insightsRef.current.contains(event.target as Node)) {
        setIsInsightsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when navigating
  useEffect(() => {
    setIsInsightsOpen(false);
  }, [pathname]);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isInsightsActive = () => {
    return insightsItems.some(item => isActive(item.href));
  };

  return (
    <nav className="bg-gray-900 border-b border-cyan-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center">
                <span className="font-orbitron text-cyan-400 text-lg font-bold tracking-wider mr-1">YT</span>
                <span className="font-rajdhani text-white text-lg font-bold">ANALYZER</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      isActive(item.href)
                        ? 'bg-gray-800 text-cyan-400 border border-cyan-700 shadow-[0_0_5px_rgba(0,255,255,0.3)]'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-cyan-300'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}

                {/* Insights Dropdown */}
                <div className="relative" ref={insightsRef}>
                  <button
                    onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-150 ${
                      isInsightsActive()
                        ? 'bg-gray-800 text-cyan-400 border border-cyan-700 shadow-[0_0_5px_rgba(0,255,255,0.3)]'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-cyan-300'
                    }`}
                  >
                    <span>Insights</span>
                    <svg
                      className={`ml-1 h-4 w-4 transition-transform ${isInsightsOpen ? 'rotate-180' : ''}`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isInsightsOpen && (
                    <div className="absolute left-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                      {insightsItems.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-4 py-2 text-sm ${
                            isActive(item.href)
                              ? 'bg-gray-700 text-cyan-400'
                              : 'text-gray-300 hover:bg-gray-700 hover:text-cyan-300'
                          }`}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'bg-gray-900 text-cyan-400 border border-cyan-800'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-cyan-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          
          {/* Mobile Insights Header */}
          <div className="px-3 py-2 text-gray-400 text-sm font-semibold border-t border-gray-700 mt-2 pt-2">
            INSIGHTS
          </div>
          
          {/* Mobile Insights Items */}
          {insightsItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 pl-6 rounded-md text-base font-medium ${
                isActive(item.href)
                  ? 'bg-gray-900 text-cyan-400 border border-cyan-800'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-cyan-300'
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 