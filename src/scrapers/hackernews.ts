import axios from 'axios';
import { ScrapedHeadline } from '../types';

interface HNStory {
  objectID: string;
  title: string;
  url?: string;
  points: number;
  num_comments?: number;
  story_text?: string;
}

export class HackerNewsScraper {
  private readonly apiUrl = 'http://hn.algolia.com/api/v1/search';

  async scrape(): Promise<ScrapedHeadline[]> {
    try {
      const response = await axios.get(this.apiUrl, {
        params: {
          tags: 'story',
          hitsPerPage: 20,
          numericFilters: 'created_at_i>' + Math.floor(Date.now() / 1000 - 86400)
        }
      });

      const stories: HNStory[] = response.data.hits;
      const headlines: ScrapedHeadline[] = [];

      for (const story of stories) {
        if (story.title && story.url) {
          headlines.push({
            title: story.title,
            url: story.url,
            popularity: story.points,
            points: story.points,
            hnDiscussionUrl: `https://news.ycombinator.com/item?id=${story.objectID}`
          });
        }
      }

      return headlines.sort((a, b) => b.popularity - a.popularity);
    } catch (error) {
      console.error('Error scraping Hacker News:', error);
      return [];
    }
  }
}