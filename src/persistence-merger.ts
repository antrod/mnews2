import crypto from 'crypto';
import stringSimilarity from 'string-similarity';
import OpenAI from 'openai';
import { NewsDatabase } from './db';
import { Headline, CrossPlatformStory, Source, ScrapedHeadline } from './types';
import { TechmemeScraper } from './scrapers/techmeme';
import { HackerNewsScraper } from './scrapers/hackernews';
import { NineToFiveMacScraper } from './scrapers/9to5mac';

export class PersistenceMerger {
  private db: NewsDatabase;
  private openai: OpenAI;
  private techmemeScraper: TechmemeScraper;
  private hackerNewsScraper: HackerNewsScraper;
  private nineToFiveMacScraper: NineToFiveMacScraper;

  constructor(openaiApiKey: string) {
    this.db = new NewsDatabase();
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.techmemeScraper = new TechmemeScraper();
    this.hackerNewsScraper = new HackerNewsScraper();
    this.nineToFiveMacScraper = new NineToFiveMacScraper();
  }

  async processAllSources(): Promise<void> {
    console.log('🔄 Processing all sources...');
    
    const sources = [
      { name: 'techmeme' as Source, scraper: this.techmemeScraper },
      { name: 'hackernews' as Source, scraper: this.hackerNewsScraper },
      { name: '9to5mac' as Source, scraper: this.nineToFiveMacScraper }
    ];

    for (const source of sources) {
      console.log(`📡 Scraping ${source.name}...`);
      const headlines = await source.scraper.scrape();
      
      for (const scrapedHeadline of headlines) {
        const headline: Headline = {
          title: scrapedHeadline.title,
          url: scrapedHeadline.url,
          source: source.name,
          timestamp: new Date(),
          popularity: scrapedHeadline.popularity,
          points: scrapedHeadline.points,
          commentCount: scrapedHeadline.commentCount,
          hnDiscussionUrl: scrapedHeadline.hnDiscussionUrl,
          contentHash: this.generateContentHash(scrapedHeadline.title, scrapedHeadline.url)
        };

        await this.db.insertHeadline(headline);
      }
      
      console.log(`✅ ${source.name}: ${headlines.length} headlines processed`);
    }

    await this.findCrossPlatformStories();
  }

  private async findCrossPlatformStories(): Promise<void> {
    console.log('🔍 Finding cross-platform stories...');
    
    const recentHeadlines = await this.db.getRecentHeadlines(12);
    const groupedBySource = this.groupBySource(recentHeadlines);
    
    const matches: Array<{
      title: string;
      sources: Source[];
      headlines: Headline[];
    }> = [];

    for (const source1 of Object.keys(groupedBySource)) {
      for (const source2 of Object.keys(groupedBySource)) {
        if (source1 >= source2) continue;

        const headlines1 = groupedBySource[source1 as Source];
        const headlines2 = groupedBySource[source2 as Source];

        for (const h1 of headlines1) {
          for (const h2 of headlines2) {
            const similarity = stringSimilarity.compareTwoStrings(
              this.normalizeTitle(h1.title),
              this.normalizeTitle(h2.title)
            );

            if (similarity > 0.5) {
              const existingMatch = matches.find(m => 
                m.headlines.some(h => h.id === h1.id) ||
                m.headlines.some(h => h.id === h2.id)
              );

              if (!existingMatch) {
                matches.push({
                  title: h1.title,
                  sources: [h1.source, h2.source],
                  headlines: [h1, h2]
                });
              } else {
                if (!existingMatch.sources.includes(h1.source)) {
                  existingMatch.sources.push(h1.source);
                }
                if (!existingMatch.sources.includes(h2.source)) {
                  existingMatch.sources.push(h2.source);
                }
                if (!existingMatch.headlines.find(h => h.id === h1.id)) {
                  existingMatch.headlines.push(h1);
                }
                if (!existingMatch.headlines.find(h => h.id === h2.id)) {
                  existingMatch.headlines.push(h2);
                }
              }
            }
          }
        }
      }
    }

    console.log(`🎯 Found ${matches.length} cross-platform stories`);

    for (const match of matches) {
      if (match.sources.length >= 2) {
        const summary = await this.generateSummary(match.headlines);
        
        const techmemeHeadline = match.headlines.find(h => h.source === 'techmeme');
        const hackernewsHeadline = match.headlines.find(h => h.source === 'hackernews');

        const crossStory: Omit<CrossPlatformStory, 'id'> = {
          title: match.title,
          techmemeUrl: techmemeHeadline?.url,
          hackernewsUrl: hackernewsHeadline?.url,
          summary,
          firstSeen: new Date(Math.min(...match.headlines.map(h => h.timestamp.getTime()))),
          techmemeHeadlineId: techmemeHeadline?.id,
          hackernewsHeadlineId: hackernewsHeadline?.id
        };

        await this.db.insertCrossPlatformStory(crossStory);
      }
    }
  }

  private async generateSummary(headlines: Headline[]): Promise<string> {
    try {
      const titles = headlines.map(h => h.title).join('\n');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a tech news summarizer. Create a concise, neutral summary (max 100 words) of these related headlines from different sources.'
          },
          {
            role: 'user',
            content: `Summarize these related headlines:\n${titles}`
          }
        ],
        max_tokens: 150,
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Summary unavailable';
    } catch (error) {
      console.error('Error generating summary:', error);
      return 'Summary unavailable';
    }
  }

  private groupBySource(headlines: Headline[]): Record<Source, Headline[]> {
    const grouped: Record<Source, Headline[]> = {
      techmeme: [],
      hackernews: [],
      '9to5mac': []
    };

    for (const headline of headlines) {
      grouped[headline.source].push(headline);
    }

    return grouped;
  }

  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private generateContentHash(title: string, url: string): string {
    const content = `${title}|${url}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async getCrossPlatformStories(): Promise<CrossPlatformStory[]> {
    return await this.db.getCrossPlatformStories();
  }

  async getRecentHeadlines(hours: number = 12): Promise<Headline[]> {
    return await this.db.getRecentHeadlines(hours);
  }

  close(): void {
    this.db.close();
  }
}