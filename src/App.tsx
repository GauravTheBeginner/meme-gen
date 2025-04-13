import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, RefreshCw, Loader2, Download, AlertTriangle } from 'lucide-react';
import { GiphyFetch } from '@giphy/js-fetch-api';

// Initialize Giphy API with a public API key
const gf = new GiphyFetch('GlVGYHkr3WSBnllca54iNt0yFbjz7L65');

interface GifData {
  id: string;
  title: string;
  images: {
    original: {
      url: string;
    };
  };
}

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  const loadGifs = async (isNewSearch = false) => {
    try {
      setLoading(true);
      setError('');
      
      const currentOffset = isNewSearch ? 0 : offset;
      const { data, pagination } = searchTerm
        ? await gf.search(searchTerm, {
            offset: currentOffset,
            limit: 20,
            rating: isAdult ? 'r' : 'g'
          })
        : await gf.trending({
            offset: currentOffset,
            limit: 20,
            rating: isAdult ? 'r' : 'g'
          });

      const formattedData = data.map(gif => ({
        id: String(gif.id),
        title: gif.title,
        images: gif.images
      }));

      setGifs(prev => isNewSearch ? formattedData : [...prev, ...formattedData]);
      setOffset(currentOffset + data.length);
      setHasMore(currentOffset + data.length < pagination.total_count);
    } catch (err) {
      setError('Failed to load GIFs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const lastGifRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadGifs();
      }
    });

    if (node) {
      observer.current.observe(node);
    }
  }, [loading, hasMore]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setOffset(0);
    loadGifs(true);
  };

  const handleDownload = async (url: string, title: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gif`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download GIF:', err);
    }
  };

  const resetSearch = () => {
    setSearchTerm('');
    setOffset(0);
    loadGifs(true);
  };

  useEffect(() => {
    loadGifs(true);
  }, [isAdult]);

  return (
    <div className="min-h-screen bg-[#000090] text-white">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 sm:mb-8">
          Gif-Hub!!
        </h1>
        
        <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for memes..."
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
              <Search className="absolute right-3 top-2.5 text-white/50" size={20} />
            </div>
            <button
              type="button"
              onClick={resetSearch}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              disabled={loading}
            >
              <RefreshCw className={`${loading ? 'animate-spin' : ''}`} size={20} />
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
          
          <div className="mt-4 flex items-center justify-between gap-4 p-4 rounded-lg bg-white/5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-300" />
              <span className="text-sm">Adult Content</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isAdult}
                onChange={(e) => setIsAdult(e.target.checked)}
              />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
        </form>

        {error && (
          <div className="text-red-300 text-center mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {gifs.map((gif, index) => (
            <div
              key={gif.id}
              ref={index === gifs.length - 1 ? lastGifRef : undefined}
              className="relative group overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="aspect-square sm:aspect-video w-full">
                <img
                  src={gif.images.original.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="p-3 sm:p-4 w-full flex justify-between items-center">
                  <p className="text-xs sm:text-sm truncate flex-1 mr-2 sm:mr-4">{gif.title}</p>
                  <button
                    onClick={() => handleDownload(gif.images.original.url, gif.title)}
                    className="p-1.5 sm:p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                    title="Download GIF"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <div ref={loadingRef} className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin" size={40} />
          </div>
        )}

        {!loading && !hasMore && gifs.length > 0 && (
          <div className="text-center py-8 text-white/70">
            No more GIFs to load
          </div>
        )}
      </div>
    </div>
  );
}

export default App;