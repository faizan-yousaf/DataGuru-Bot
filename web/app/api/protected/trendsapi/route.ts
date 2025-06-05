import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Types for article data
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

// Cache for storing articles
let articlesCache: { data: Article[]; timestamp: number } | null = null;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// Enhanced dummy data for fallback
function getDummyArticles(): Article[] {
  console.log('🔄 [API] Generating dummy articles as fallback');
  return [
    {
      id: 'dummy-1',
      title: 'Advanced Machine Learning Techniques for Data Scientists',
      snippet: 'Explore cutting-edge ML algorithms and their practical applications in real-world data science projects.',
      url: 'https://www.kdnuggets.com/advanced-ml-techniques',
      source: 'KDnuggets',
      publishedDate: new Date().toISOString().split('T')[0],
      category: 'Machine Learning',
      imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
      author: 'Data Science Team',
      readTime: '12 min read'
    },
    {
      id: 'dummy-2',
      title: 'Python Data Analysis: Complete Beginner Guide',
      snippet: 'Master data analysis with Python using pandas, numpy, and matplotlib with hands-on examples.',
      url: 'https://www.analyticsvidhya.com/python-data-analysis',
      source: 'Analytics Vidhya',
      publishedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      category: 'Programming',
      imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
      author: 'Analytics Team',
      readTime: '8 min read'
    },
    {
      id: 'dummy-3',
      title: 'Deep Learning Fundamentals and Applications',
      snippet: 'Understanding neural networks, deep learning architectures, and their implementation in modern AI systems.',
      url: 'https://datasciencedojo.com/deep-learning-guide',
      source: 'Data Science Dojo',
      publishedDate: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      category: 'Deep Learning',
      imageUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400',
      author: 'DS Dojo Team',
      readTime: '15 min read'
    },
    {
      id: 'dummy-4',
      title: 'Data Visualization Best Practices for 2024',
      snippet: 'Learn modern data visualization techniques and tools to create compelling and insightful charts.',
      url: 'https://www.datacamp.com/data-visualization-guide',
      source: 'DataCamp',
      publishedDate: new Date(Date.now() - 259200000).toISOString().split('T')[0],
      category: 'Data Visualization',
      imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
      author: 'DataCamp Team',
      readTime: '10 min read'
    },
    {
      id: 'dummy-5',
      title: 'Career Guide: Becoming a Data Scientist in 2024',
      snippet: 'Complete roadmap for aspiring data scientists including skills, tools, and career progression strategies.',
      url: 'https://365datascience.com/career-guide',
      source: '365 Data Science',
      publishedDate: new Date(Date.now() - 345600000).toISOString().split('T')[0],
      category: 'Career',
      imageUrl: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400',
      author: '365DS Team',
      readTime: '18 min read'
    }
  ];
}

// Scraping function for KDnuggets
async function scrapeKDnuggets(): Promise<Article[]> {
  console.log('🔍 [SCRAPER] Starting KDnuggets scraping...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.kdnuggets.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }
    });

    console.log(`📡 [KDN] Response status: ${response.status}, took ${Date.now() - startTime}ms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 [KDN] HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    console.log(`🎯 [KDN] Searching for articles...`);
    
    $('article, .post, .entry').each((index, element) => {
      if (index >= 8) return false;
      
      const $el = $(element);
      const title = $el.find('h1, h2, h3, .title, .post-title').first().text().trim();
      const snippet = $el.find('p, .excerpt, .summary').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const author = $el.find('.author, .by-author').first().text().trim();
      
      console.log(`📝 [KDN] Article ${index}: Title="${title.substring(0, 50)}...", Link="${link}"`);
      
      if (title && title.length > 10) {
        const fullUrl = link?.startsWith('http') ? link : `https://www.kdnuggets.com${link}`;
        
        articles.push({
          id: `kdn-${Date.now()}-${index}`,
          title: title.substring(0, 150),
          snippet: snippet.substring(0, 200) || 'Discover insights and trends in data science and machine learning.',
          url: fullUrl || 'https://www.kdnuggets.com',
          source: 'KDnuggets',
          publishedDate: new Date().toISOString().split('T')[0],
          category: 'Data Science',
          imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400',
          author: author || 'KDnuggets Team',
          readTime: '6 min read'
        });
      }
    });

    console.log(`✅ [KDN] Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('❌ [KDN] Error scraping KDnuggets:', error);
    return [];
  }
}

// Scraping function for Analytics Vidhya
async function scrapeAnalyticsVidhya(): Promise<Article[]> {
  console.log('🔍 [SCRAPER] Starting Analytics Vidhya scraping...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.analyticsvidhya.com/blog/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }
    });

    console.log(`📡 [AV] Response status: ${response.status}, took ${Date.now() - startTime}ms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 [AV] HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    $('.post, article, .blog-post').each((index, element) => {
      if (index >= 8) return false;
      
      const $el = $(element);
      const title = $el.find('h1, h2, h3, .title, .post-title').first().text().trim();
      const snippet = $el.find('p, .excerpt, .summary').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const author = $el.find('.author, .by-author').first().text().trim();
      
      console.log(`📝 [AV] Article ${index}: Title="${title.substring(0, 50)}...", Link="${link}"`);
      
      if (title && title.length > 10) {
        const fullUrl = link?.startsWith('http') ? link : `https://www.analyticsvidhya.com${link}`;
        
        articles.push({
          id: `av-${Date.now()}-${index}`,
          title: title.substring(0, 150),
          snippet: snippet.substring(0, 200) || 'Learn data science and analytics with practical tutorials and guides.',
          url: fullUrl || 'https://www.analyticsvidhya.com',
          source: 'Analytics Vidhya',
          publishedDate: new Date().toISOString().split('T')[0],
          category: 'Analytics',
          imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
          author: author || 'AV Team',
          readTime: '7 min read'
        });
      }
    });

    console.log(`✅ [AV] Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('❌ [AV] Error scraping Analytics Vidhya:', error);
    return [];
  }
}

// Scraping function for Data Science Dojo
async function scrapeDataScienceDojo(): Promise<Article[]> {
  console.log('🔍 [SCRAPER] Starting Data Science Dojo scraping...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://datasciencedojo.com/blog/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }
    });

    console.log(`📡 [DSD] Response status: ${response.status}, took ${Date.now() - startTime}ms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 [DSD] HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    $('article, .post, .blog-post').each((index, element) => {
      if (index >= 6) return false;
      
      const $el = $(element);
      const title = $el.find('h1, h2, h3, .title, .post-title').first().text().trim();
      const snippet = $el.find('p, .excerpt, .summary').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const author = $el.find('.author, .by-author').first().text().trim();
      
      console.log(`📝 [DSD] Article ${index}: Title="${title.substring(0, 50)}...", Link="${link}"`);
      
      if (title && title.length > 10) {
        const fullUrl = link?.startsWith('http') ? link : `https://datasciencedojo.com${link}`;
        
        articles.push({
          id: `dsd-${Date.now()}-${index}`,
          title: title.substring(0, 150),
          snippet: snippet.substring(0, 200) || 'Master data science with comprehensive tutorials and practical examples.',
          url: fullUrl || 'https://datasciencedojo.com',
          source: 'Data Science Dojo',
          publishedDate: new Date().toISOString().split('T')[0],
          category: 'Data Science',
          imageUrl: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400',
          author: author || 'DS Dojo Team',
          readTime: '8 min read'
        });
      }
    });

    console.log(`✅ [DSD] Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('❌ [DSD] Error scraping Data Science Dojo:', error);
    return [];
  }
}

// Scraping function for DataCamp
async function scrapeDataCamp(): Promise<Article[]> {
  console.log('🔍 [SCRAPER] Starting DataCamp scraping...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.datacamp.com/blog', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }
    });

    console.log(`📡 [DC] Response status: ${response.status}, took ${Date.now() - startTime}ms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 [DC] HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    $('article, .post, .blog-post').each((index, element) => {
      if (index >= 6) return false;
      
      const $el = $(element);
      const title = $el.find('h1, h2, h3, .title, .post-title').first().text().trim();
      const snippet = $el.find('p, .excerpt, .summary').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const author = $el.find('.author, .by-author').first().text().trim();
      
      console.log(`📝 [DC] Article ${index}: Title="${title.substring(0, 50)}...", Link="${link}"`);
      
      if (title && title.length > 10) {
        const fullUrl = link?.startsWith('http') ? link : `https://www.datacamp.com${link}`;
        
        articles.push({
          id: `dc-${Date.now()}-${index}`,
          title: title.substring(0, 150),
          snippet: snippet.substring(0, 200) || 'Learn data science and programming with interactive courses and tutorials.',
          url: fullUrl || 'https://www.datacamp.com',
          source: 'DataCamp',
          publishedDate: new Date().toISOString().split('T')[0],
          category: 'Education',
          imageUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
          author: author || 'DataCamp Team',
          readTime: '9 min read'
        });
      }
    });

    console.log(`✅ [DC] Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('❌ [DC] Error scraping DataCamp:', error);
    return [];
  }
}

// Keep the existing GeeksforGeeks scraper
async function scrapeGeeksforGeeks(): Promise<Article[]> {
  console.log('🔍 [SCRAPER] Starting GeeksforGeeks scraping...');
  try {
    const startTime = Date.now();
    const response = await fetch('https://www.geeksforgeeks.org/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      next: { revalidate: 3600 }
    });

    console.log(`📡 [GFG] Response status: ${response.status}, took ${Date.now() - startTime}ms`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`📄 [GFG] HTML length: ${html.length} characters`);
    
    const $ = cheerio.load(html);
    const articles: Article[] = [];

    $('.head, .article-title, .post-title, .entry-title').each((index, element) => {
      if (index >= 6) return false;
      
      const $el = $(element);
      const $parent = $el.closest('article, .post, .entry, .article-card');
      
      const title = $el.text().trim();
      const link = $el.find('a').attr('href') || $parent.find('a').first().attr('href');
      const snippet = $parent.find('.excerpt, .summary, .content, p').first().text().trim();
      
      console.log(`📝 [GFG] Article ${index}: Title="${title.substring(0, 50)}...", Link="${link}"`);
      
      if (title && title.length > 10) {
        const fullUrl = link?.startsWith('http') ? link : `https://www.geeksforgeeks.org${link}`;
        
        articles.push({
          id: `gfg-${Date.now()}-${index}`,
          title: title.substring(0, 150),
          snippet: snippet.substring(0, 200) || 'Learn programming concepts and algorithms with detailed explanations.',
          url: fullUrl || 'https://www.geeksforgeeks.org',
          source: 'GeeksforGeeks',
          publishedDate: new Date().toISOString().split('T')[0],
          category: 'Programming',
          imageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400',
          author: 'GFG Editorial',
          readTime: '6 min read'
        });
      }
    });

    console.log(`✅ [GFG] Successfully scraped ${articles.length} articles`);
    return articles;
  } catch (error) {
    console.error('❌ [GFG] Error scraping GeeksforGeeks:', error);
    return [];
  }
}

// Main function to fetch all articles
async function fetchAllArticles(): Promise<Article[]> {
  console.log('🚀 [API] Starting fetchAllArticles...');
  
  // Check cache first
  if (articlesCache && (Date.now() - articlesCache.timestamp) < CACHE_DURATION) {
    console.log(`💾 [CACHE] Using cached data (${articlesCache.data.length} articles, age: ${Math.round((Date.now() - articlesCache.timestamp) / 60000)} minutes)`);
    return articlesCache.data;
  }

  console.log('🔄 [CACHE] Cache expired or empty, fetching fresh data...');
  
  try {
    // Parallel scraping with timeout for all new sources
    const scrapePromises = [
      Promise.race([
        scrapeKDnuggets(),
        new Promise<Article[]>((_, reject) => 
          setTimeout(() => reject(new Error('KDnuggets scraping timeout')), 15000)
        )
      ]),
      Promise.race([
        scrapeAnalyticsVidhya(),
        new Promise<Article[]>((_, reject) => 
          setTimeout(() => reject(new Error('Analytics Vidhya scraping timeout')), 15000)
        )
      ]),
      Promise.race([
        scrapeDataScienceDojo(),
        new Promise<Article[]>((_, reject) => 
          setTimeout(() => reject(new Error('Data Science Dojo scraping timeout')), 15000)
        )
      ]),
      Promise.race([
        scrapeDataCamp(),
        new Promise<Article[]>((_, reject) => 
          setTimeout(() => reject(new Error('DataCamp scraping timeout')), 15000)
        )
      ]),
      Promise.race([
        scrapeGeeksforGeeks(),
        new Promise<Article[]>((_, reject) => 
          setTimeout(() => reject(new Error('GFG scraping timeout')), 15000)
        )
      ])
    ];

    const results = await Promise.allSettled(scrapePromises);
    console.log('📊 [SCRAPER] Detailed scraping results:');
    results.forEach((result, index) => {
      const sources = ['KDnuggets', 'Analytics Vidhya', 'Data Science Dojo', 'DataCamp', 'GeeksforGeeks'];
      if (result.status === 'fulfilled') {
        console.log(`✅ ${sources[index]}: ${result.value.length} articles`);
        result.value.forEach((article, i) => {
          console.log(`   ${i+1}. ${article.title.substring(0, 50)}...`);
        });
      } else {
        console.error(`❌ ${sources[index]} FAILED:`, result.reason);
      }
    });

    const allArticles = results
      .filter((result): result is PromiseFulfilledResult<Article[]> => result.status === 'fulfilled')
      .flatMap(result => result.value);

    console.log(`📈 [SCRAPER] Total scraped articles: ${allArticles.length}`);

    // If no articles scraped, use dummy data
    const finalArticles = allArticles.length > 0 ? allArticles : getDummyArticles();
    
    // Update cache
    articlesCache = {
      data: finalArticles,
      timestamp: Date.now()
    };

    console.log(`💾 [CACHE] Updated cache with ${finalArticles.length} articles (${allArticles.length > 0 ? 'scraped' : 'dummy'} data)`);
    return finalArticles;
    
  } catch (error) {
    console.error('❌ [API] Error in fetchAllArticles:', error);
    // Return dummy data as fallback
    const dummyArticles = getDummyArticles();
    articlesCache = {
      data: dummyArticles,
      timestamp: Date.now()
    };
    console.log('🔄 [FALLBACK] Using dummy data due to scraping failure');
    return dummyArticles;
  }
}

// GET endpoint
export async function GET(request: NextRequest) {
  console.log('🌐 [GET] API endpoint called');
  console.log('📋 [GET] Request URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const source = searchParams.get('source');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search')?.toLowerCase();

    console.log('🔍 [GET] Query parameters:', { category, source, limit, search });

    let articles = await fetchAllArticles();
    console.log(`📊 [GET] Initial articles count: ${articles.length}`);

    // Apply filters
    if (category && category !== 'all') {
      const beforeFilter = articles.length;
      articles = articles.filter(article => 
        article.category.toLowerCase().includes(category.toLowerCase())
      );
      console.log(`🔽 [FILTER] Category filter "${category}": ${beforeFilter} → ${articles.length}`);
    }

    if (source && source !== 'all') {
      const beforeFilter = articles.length;
      articles = articles.filter(article => 
        article.source.toLowerCase().includes(source.toLowerCase())
      );
      console.log(`🔽 [FILTER] Source filter "${source}": ${beforeFilter} → ${articles.length}`);
    }

    if (search) {
      const beforeFilter = articles.length;
      articles = articles.filter(article => 
        article.title.toLowerCase().includes(search) ||
        article.snippet.toLowerCase().includes(search)
      );
      console.log(`🔽 [FILTER] Search filter "${search}": ${beforeFilter} → ${articles.length}`);
    }

    // Apply limit
    const beforeLimit = articles.length;
    articles = articles.slice(0, limit);
    console.log(`🔽 [LIMIT] Applied limit ${limit}: ${beforeLimit} → ${articles.length}`);

    const response = {
      success: true,
      data: articles,
      total: articles.length,
      sources: ['KDnuggets', 'Analytics Vidhya', 'Data Science Dojo', 'DataCamp', 'GeeksforGeeks'],
      lastUpdated: articlesCache?.timestamp ? new Date(articlesCache.timestamp).toISOString() : new Date().toISOString(),
      isLiveData: articles.some(a => !a.id.startsWith('dummy-'))
    };

    console.log('✅ [GET] Sending response:', {
      success: response.success,
      articleCount: response.data.length,
      isLiveData: response.isLiveData,
      sources: response.sources
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ [GET] API Error:', error);
    const fallbackResponse = {
      success: false, 
      error: 'Failed to fetch articles',
      data: getDummyArticles(),
      isLiveData: false
    };
    
    console.log('🔄 [GET] Sending fallback response with dummy data');
    return NextResponse.json(fallbackResponse, { status: 500 });
  }
}

// POST endpoint for manual cache refresh
export async function POST() {
  console.log('🌐 [POST] Cache refresh endpoint called');
  
  try {
    // Clear cache to force refresh
    console.log('🗑️ [POST] Clearing cache...');
    articlesCache = null;
    
    const articles = await fetchAllArticles();
    
    const response = {
      success: true,
      message: 'Cache refreshed successfully',
      data: articles,
      total: articles.length,
      isLiveData: articles.some(a => !a.id.startsWith('dummy-'))
    };

    console.log('✅ [POST] Cache refresh successful:', {
      articleCount: response.total,
      isLiveData: response.isLiveData
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ [POST] Cache refresh error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh cache' },
      { status: 500 }
    );
  }
}