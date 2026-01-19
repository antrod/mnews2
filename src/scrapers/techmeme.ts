import axios from 'axios';
import * as cheerio from 'cheerio';
import { ScrapedHeadline } from '../types';

export class TechmemeScraper {
  private readonly url = 'https://www.techmeme.com';

  async scrape(): Promise<ScrapedHeadline[]> {
    try {
      const response = await axios.get(this.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const headlines: ScrapedHeadline[] = [];

      $('.items').find('a').each((index, element) => {
        const $el = $(element);
        const title = $el.text().trim();
        const url = $el.attr('href');
        
        if (title && url && !url.startsWith('/')) {
          headlines.push({
            title,
            url,
            popularity: index + 1
          });
        }
      });

      return headlines.slice(0, 20);
    } catch (error) {
      console.error('Error scraping Techmeme:', error);
      return [];
    }
  }
}