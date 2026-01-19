import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedHeadline } from '../types';

interface RSSItem {
  title: string;
  link: string;
  'dc:creator'?: string;
  'slash:comments'?: string;
}

export class NineToFiveMacScraper {
  private readonly rssUrl = 'https://9to5mac.com/feed/';

  async scrape(): Promise<ScrapedHeadline[]> {
    try {
      const response = await axios.get(this.rssUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });
      const headlines: ScrapedHeadline[] = [];

      $('item').each((index, element) => {
        const $item = $(element);
        const title = $item.find('title').text().trim();
        const link = $item.find('link').text().trim();
        const creator = $item.find('dc\\:creator').text().trim();
        const comments = $item.find('slash\\:comments').text().trim();

        if (title && link && !creator.toLowerCase().includes('sponsored')) {
          headlines.push({
            title,
            url: link,
            popularity: parseInt(comments) || 0,
            commentCount: parseInt(comments) || 0
          });
        }
      });

      return headlines
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 20);
    } catch (error) {
      console.error('Error scraping 9to5Mac:', error);
      return [];
    }
  }
}