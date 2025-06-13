import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Types matching the web implementation
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
      return <Ionicons name="analytics" size={20} color="#3B82F6" />;
    case 'Data Science':
    case 'Programming':
      return <Ionicons name="server" size={20} color="#10B981" />;
    case 'Technology':
    case 'Web Development':
      return <Ionicons name="hardware-chip" size={20} color="#8B5CF6" />;
    default:
      return <Ionicons name="trending-up" size={20} color="#6B7280" />;
  }
};

const ArticleCard = ({ article }: { article: Article }) => {
  const handlePress = async () => {
    try {
      await Linking.openURL(article.url);
    } catch (error) {
      Alert.alert('Error', 'Could not open article');
    }
  };

  return (
    <TouchableOpacity style={styles.articleCard} onPress={handlePress}>
      {/* Article Header */}
      <View style={styles.articleHeader}>
        <View style={styles.categoryContainer}>
          <CategoryIcon category={article.category} />
          <Text style={styles.categoryText}>{article.category}</Text>
        </View>
        <Text style={styles.sourceText}>{article.source}</Text>
      </View>
      
      {/* Article Content */}
      <View style={styles.articleContent}>
        {/* Date */}
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={16} color="#6B7280" />
          <Text style={styles.dateText}>
            {new Date(article.publishedDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
        </View>
        
        {/* Title */}
        <Text style={styles.articleTitle} numberOfLines={2}>
          {article.title}
        </Text>
        
        {/* Snippet */}
        <Text style={styles.articleSnippet} numberOfLines={3}>
          {article.snippet}
        </Text>
        
        {/* Footer */}
        <View style={styles.articleFooter}>
          <View style={styles.readTimeContainer}>
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text style={styles.readTimeText}>{article.readTime || 'Latest'}</Text>
          </View>
          <View style={styles.readMoreContainer}>
            <Text style={styles.readMoreText}>Read More</Text>
            <Ionicons name="open-outline" size={16} color="#3B82F6" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FilterButton = ({ 
  category, 
  isActive, 
  onPress, 
  count 
}: { 
  category: string; 
  isActive: boolean; 
  onPress: () => void; 
  count: number;
}) => {
  return (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={onPress}
    >
      <CategoryIcon category={category} />
      <Text style={[styles.filterButtonText, isActive && styles.activeFilterButtonText]}>
        {category}
      </Text>
      <View style={[styles.countBadge, isActive && styles.activeCountBadge]}>
        <Text style={[styles.countText, isActive && styles.activeCountText]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const LoadingSkeleton = () => (
  <View style={styles.skeletonContainer}>
    {[...Array(6)].map((_, i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonText} />
          <View style={[styles.skeletonText, { width: '75%' }]} />
        </View>
      </View>
    ))}
  </View>
);

export default function TrendsScreen() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'https://data-guru-rho.vercel.app/'; // Update with your API URL

  const fetchArticles = useCallback(async (category = 'All', page = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setArticles([]);
        setError(null);
      }
      
      const params = {
        category: category === 'All' ? '' : category,
        page: page.toString(),
        limit: '12'
      };
      
      const response = await axios.get(`${API_BASE_URL}/api/protected/trendsapi`, { params });
      
      const data: ApiResponse = response.data;
      
      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }
      
      if (reset || page === 1) {
        setArticles(data.data || []);
      } else {
        setArticles(prev => [...prev, ...(data.data || [])]);
      }
      
      setHasMore((data.data?.length || 0) >= 12);
      setCurrentPage(page);
      
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError(axios.isAxiosError(error) ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  const triggerScrape = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/protected/trendsapi`);
      
      if (response.data.success) {
        await fetchArticles(activeFilter, 1, true);
      } else {
        throw new Error(response.data.error || 'Refresh failed');
      }
    } catch (error) {
      console.error('Error during refresh:', error);
      setError(axios.isAxiosError(error) ? error.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const filterArticles = (category: string) => {
    setActiveFilter(category);
    setCurrentPage(1);
    fetchArticles(category, 1, true);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchArticles(activeFilter, currentPage + 1);
    }
  };

  const filteredArticles = searchTerm
    ? articles.filter(article => 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.snippet.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : articles;

  const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];

  useEffect(() => {
    fetchArticles('All', 1, true);
  }, [fetchArticles]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.logoContainer}>
            <Ionicons name="analytics" size={24} color="#161612" />
            <Text style={styles.logoText}>Data Guru</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle" size={32} color="#161612" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#817f6a" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#817f6a"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={triggerScrape} />
        }
      >
        {/* Title and Refresh Button */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Trends</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={triggerScrape}
            disabled={refreshing}
          >
            <Ionicons 
              name="refresh" 
              size={20} 
              color="#161612" 
              style={refreshing && styles.spinning}
            />
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ Error: {error}</Text>
          </View>
        )}

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          <View style={styles.filtersContent}>
            {categories.map((category) => {
              const count = category === 'All' 
                ? articles.length 
                : articles.filter(a => a.category === category).length;
              
              return (
                <FilterButton
                  key={category}
                  category={category}
                  isActive={activeFilter === category}
                  onPress={() => filterArticles(category)}
                  count={count}
                />
              );
            })}
          </View>
        </ScrollView>

        {/* Articles */}
        {loading ? (
          <LoadingSkeleton />
        ) : filteredArticles.length > 0 ? (
          <>
            <View style={styles.articlesContainer}>
              {filteredArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </View>
            
            {/* Load More Button */}
            {hasMore && !searchTerm && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={loadMore}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loadMoreText}>Load More Articles</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="trending-up" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchTerm ? 'No articles found' : 'No articles available'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchTerm 
                ? `No articles match "${searchTerm}". Try a different search term.`
                : 'Try refreshing to fetch the latest articles.'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity style={styles.emptyRefreshButton} onPress={triggerScrape}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.emptyRefreshText}>Refresh Articles</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#f4f3f1',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#161612',
  },
  profileButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f4f3f1',
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 40,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#161612',
  },
  content: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#161612',
  },
  refreshButton: {
    backgroundColor: '#f4f3f1',
    borderRadius: 8,
    padding: 8,
  },
  spinning: {
    // Add rotation animation if needed
  },
  errorContainer: {
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filtersContent: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  activeFilterButton: {
    backgroundColor: '#3B82F6',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeCountBadge: {
    backgroundColor: '#2563EB',
  },
  countText: {
    fontSize: 12,
    color: '#374151',
  },
  activeCountText: {
    color: '#FFFFFF',
  },
  articlesContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  articleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  articleHeader: {
    height: 120,
    backgroundColor: '#EEF2FF',
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sourceText: {
    fontSize: 12,
    color: '#6B7280',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-end',
  },
  articleContent: {
    padding: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#6B7280',
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 24,
  },
  articleSnippet: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  readTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readTimeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  loadMoreButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 20,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  emptyRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyRefreshText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  skeletonContainer: {
    paddingHorizontal: 20,
    gap: 20,
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonHeader: {
    height: 120,
    backgroundColor: '#F3F4F6',
  },
  skeletonContent: {
    padding: 16,
    gap: 12,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  skeletonTitle: {
    height: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  skeletonText: {
    height: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
});