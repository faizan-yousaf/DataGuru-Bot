'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, ExternalLink, Clock, TrendingUp, Brain, Database, Cpu, RefreshCw, Search } from 'lucide-react';

// Updated Types to match API response
interface Article {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: string;
  publishedDate: string;
  category: string;
  imageUrl?: string;
  author?: string;
  readTime?: string;
}

interface ApiResponse {
  success: boolean;
  data: Article[];
  total: number;
  sources: string[];
  lastUpdated: string;
  isLiveData: boolean;
  error?: string;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'AI':
    case 'Machine Learning':
      return <Brain className="w-5 h-5 text-blue-500" />;
    case 'Data Science':
    case 'Programming':
      return <Database className="w-5 h-5 text-green-500" />;
    case 'Technology':
    case 'Web Development':
      return <Cpu className="w-5 h-5 text-purple-500" />;
    default:
      return <TrendingUp className="w-5 h-5 text-gray-500" />;
  }
};

const ArticleCard = ({ article }: { article: Article }) => {
  console.log('🎨 [CARD] Rendering article:', {
    id: article.id,
    title: article.title.substring(0, 30) + '...',
    source: article.source,
    category: article.category
  });
  
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group h-full flex flex-col">
      {/* Article Header */}
      <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        <div className="absolute bottom-4 left-4 flex items-center space-x-2">
          <CategoryIcon category={article.category} />
          <span className="text-sm font-medium text-gray-700 bg-white/90 px-3 py-1 rounded-full backdrop-blur-sm">
            {article.category}
          </span>
        </div>
        <div className="absolute top-4 right-4">
          <span className="text-xs text-gray-600 bg-white/90 px-2 py-1 rounded-full backdrop-blur-sm">
            {article.source}
          </span>
        </div>
      </div>
      
      {/* Article Content */}
      <div className="p-6 flex-1 flex flex-col">
        {/* Date */}
        <div className="flex items-center text-gray-500 text-sm mb-3">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date(article.publishedDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors flex-shrink-0">
          {article.title}
        </h3>
        
        {/* Snippet */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">
          {article.snippet}
        </p>
        
        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center text-gray-500 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span>{article.readTime || 'Latest'}</span>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors group/link"
          >
            Read More
            <ExternalLink className="w-4 h-4 ml-1 group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ 
  category, 
  isActive, 
  onClick, 
  count 
}: { 
  category: string; 
  isActive: boolean; 
  onClick: () => void; 
  count: number;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <CategoryIcon category={category} />
      <span>{category}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${
        isActive ? 'bg-blue-500' : 'bg-gray-300'
      }`}>
        {count}
      </span>
    </button>
  );
};

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 animate-pulse">
        <div className="h-48 bg-gray-200" />
        <div className="p-6">
          <div className="h-4 bg-gray-200 rounded mb-3" />
          <div className="h-6 bg-gray-200 rounded mb-3" />
          <div className="h-4 bg-gray-200 rounded mb-2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export default function TrendsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  console.log('🏠 [PAGE] TrendsPage component rendered, API_BASE_URL:', API_BASE_URL);

  const fetchArticles = useCallback(async (category = 'All', page = 1, reset = false) => {
    console.log('📡 [FETCH] Starting fetchArticles:', { category, page, reset });
    
    try {
      if (reset) {
        console.log('🔄 [FETCH] Resetting articles and showing loading...');
        setLoading(true);
        setArticles([]);
        setError(null);
      }
      
      const params = new URLSearchParams({
        category: category === 'All' ? '' : category,
        page: page.toString(),
        limit: '12'
      });
      
      const url = `${API_BASE_URL}/api/protected/trendsapi?${params}`;
      console.log('🌐 [FETCH] Making request to:', url);
      
      const response = await fetch(url);
      console.log('📡 [FETCH] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      console.log('📊 [FETCH] Response data:', {
        success: data.success,
        articleCount: data.data?.length || 0,
        total: data.total,
        isLiveData: data.isLiveData,
        sources: data.sources,
        error: data.error
      });
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      if (reset || page === 1) {
        console.log('🔄 [FETCH] Setting new articles:', data.data.length);
        setArticles(data.data || []);
      } else {
        console.log('➕ [FETCH] Appending articles:', data.data.length);
        setArticles(prev => [...prev, ...(data.data || [])]);
      }
      
      // Update pagination info
      setHasMore((data.data?.length || 0) >= 12);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('❌ [FETCH] Error fetching articles:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      console.log('✅ [FETCH] Fetch completed, hiding loading...');
      setLoading(false);
    }
  }, [API_BASE_URL]); // Only recreate if API_BASE_URL changes

  const triggerScrape = async () => {
    console.log('🔄 [REFRESH] Starting manual refresh...');
    setRefreshing(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/api/protected/trendsapi`;
      console.log('🌐 [REFRESH] Making POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST'
      });
      
      console.log('📡 [REFRESH] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 [REFRESH] Refresh result:', {
        success: result.success,
        articleCount: result.data?.length || 0,
        isLiveData: result.isLiveData
      });
      
      if (result.success) {
        console.log('✅ [REFRESH] Refresh successful, fetching updated articles...');
        await fetchArticles(activeFilter, 1, true);
      } else {
        throw new Error(result.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('❌ [REFRESH] Error during refresh:', error);
      setError(error instanceof Error ? error.message : 'Refresh failed');
    } finally {
      console.log('✅ [REFRESH] Refresh completed');
      setRefreshing(false);
    }
  };

  const filterArticles = (category: string) => {
    console.log('🔽 [FILTER] Changing filter to:', category);
    setActiveFilter(category);
    setCurrentPage(1);
    fetchArticles(category, 1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      console.log('➕ [PAGINATION] Loading more articles, page:', currentPage + 1);
      fetchArticles(activeFilter, currentPage + 1);
    } else {
      console.log('⏹️ [PAGINATION] Cannot load more:', { hasMore, loading });
    }
  };

  const filteredArticles = searchTerm
    ? articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.snippet.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articles;

  console.log('🔍 [SEARCH] Filtered articles:', {
    searchTerm,
    originalCount: articles.length,
    filteredCount: filteredArticles.length
  });

  // Get unique categories from articles
  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];
  console.log('📂 [CATEGORIES] Available categories:', categories);

  // Add useCallback to fix the dependency issue

  useEffect(() => {
    console.log('🚀 [EFFECT] Component mounted, fetching initial articles...');
    fetchArticles('All', 1, true);
  }, [fetchArticles]); // Now this won't cause infinite loop

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Latest Trends
              </h1>
              <p className="text-gray-600">
                Stay updated with the latest in AI, Data Science, and Technology
              </p>
              {error && (
                <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
                  ⚠️ Error: {error}
                </div>
              )}
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <button
                onClick={triggerScrape}
                disabled={refreshing}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => {
                console.log('🔍 [SEARCH] Search term changed:', e.target.value);
                setSearchTerm(e.target.value);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const count = category === 'All' 
                ? articles.length 
                : articles.filter(a => a.category === category).length;
              
              return (
                <FilterButton
                  key={category}
                  category={category}
                  isActive={activeFilter === category}
                  onClick={() => filterArticles(category)}
                  count={count}
                />
              );
            })}
          </div>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredArticles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && !searchTerm && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More Articles'}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm ? 'No articles found' : 'No articles available'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? `No articles match "${searchTerm}". Try a different search term.`
                : 'Try refreshing to fetch the latest articles.'}
            </p>
            {!searchTerm && (
              <button
                onClick={triggerScrape}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Articles
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}