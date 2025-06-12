import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface LinkAnalysisResult {
  title: string;
  description: string;
  content: string;
  url: string;
  domain: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Validate URL
    let validUrl: URL;
    try {
      validUrl = new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Security check - only allow http/https
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return NextResponse.json(
        { error: 'Only HTTP and HTTPS URLs are allowed' },
        { status: 400 }
      );
    }

    // Fetch the webpage
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title = $('title').text().trim() || 
                 $('meta[property="og:title"]').attr('content') || 
                 $('meta[name="title"]').attr('content') || 
                 'No title found';

    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       $('meta[name="twitter:description"]').attr('content') || 
                       '';

    // Extract main content (remove scripts, styles, nav, footer, etc.)
    $('script, style, nav, footer, header, aside, .advertisement, .ads, .sidebar').remove();
    
    // Try to find main content area
    let content = '';
    const contentSelectors = [
      'main',
      'article', 
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body content if no specific content area found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up content - remove extra whitespace and limit length
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim()
      .substring(0, 3000); // Limit to 3000 characters

    const result: LinkAnalysisResult = {
      title: title.substring(0, 200), // Limit title length
      description: description.substring(0, 500), // Limit description length
      content,
      url: validUrl.href,
      domain: validUrl.hostname
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Link analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze link',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}