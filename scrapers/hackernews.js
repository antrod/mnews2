"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HackerNewsScraper = void 0;
const axios_1 = __importDefault(require("axios"));
class HackerNewsScraper {
    constructor() {
        this.apiUrl = 'http://hn.algolia.com/api/v1/search';
    }
    async scrape() {
        try {
            const response = await axios_1.default.get(this.apiUrl, {
                params: {
                    tags: 'story',
                    hitsPerPage: 20,
                    numericFilters: 'created_at_i>' + Math.floor(Date.now() / 1000 - 86400)
                }
            });
            const stories = response.data.hits;
            const headlines = [];
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
        }
        catch (error) {
            console.error('Error scraping Hacker News:', error);
            return [];
        }
    }
}
exports.HackerNewsScraper = HackerNewsScraper;
