"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersistenceMerger = void 0;
const crypto_1 = __importDefault(require("crypto"));
const string_similarity_1 = __importDefault(require("string-similarity"));
const openai_1 = __importDefault(require("openai"));
const db_1 = require("./db");
const techmeme_1 = require("./scrapers/techmeme");
const hackernews_1 = require("./scrapers/hackernews");
const _9to5mac_1 = require("./scrapers/9to5mac");
class PersistenceMerger {
    constructor(openaiApiKey) {
        this.db = new db_1.NewsDatabase();
        this.openai = new openai_1.default({ apiKey: openaiApiKey });
        this.techmemeScraper = new techmeme_1.TechmemeScraper();
        this.hackerNewsScraper = new hackernews_1.HackerNewsScraper();
        this.nineToFiveMacScraper = new _9to5mac_1.NineToFiveMacScraper();
    }
    async processAllSources() {
        console.log('🔄 Processing all sources...');
        const sources = [
            { name: 'techmeme', scraper: this.techmemeScraper },
            { name: 'hackernews', scraper: this.hackerNewsScraper },
            { name: '9to5mac', scraper: this.nineToFiveMacScraper }
        ];
        for (const source of sources) {
            console.log(`📡 Scraping ${source.name}...`);
            const headlines = await source.scraper.scrape();
            for (const scrapedHeadline of headlines) {
                const headline = {
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
    async findCrossPlatformStories() {
        console.log('🔍 Finding cross-platform stories...');
        const recentHeadlines = await this.db.getRecentHeadlines(12);
        const groupedBySource = this.groupBySource(recentHeadlines);
        const matches = [];
        for (const source1 of Object.keys(groupedBySource)) {
            for (const source2 of Object.keys(groupedBySource)) {
                if (source1 >= source2)
                    continue;
                const headlines1 = groupedBySource[source1];
                const headlines2 = groupedBySource[source2];
                for (const h1 of headlines1) {
                    for (const h2 of headlines2) {
                        const similarity = string_similarity_1.default.compareTwoStrings(this.normalizeTitle(h1.title), this.normalizeTitle(h2.title));
                        if (similarity > 0.5) {
                            const existingMatch = matches.find(m => m.headlines.some(h => h.id === h1.id) ||
                                m.headlines.some(h => h.id === h2.id));
                            if (!existingMatch) {
                                matches.push({
                                    title: h1.title,
                                    sources: [h1.source, h2.source],
                                    headlines: [h1, h2]
                                });
                            }
                            else {
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
                const crossStory = {
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
    async generateSummary(headlines) {
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
        }
        catch (error) {
            console.error('Error generating summary:', error);
            return 'Summary unavailable';
        }
    }
    groupBySource(headlines) {
        const grouped = {
            techmeme: [],
            hackernews: [],
            '9to5mac': []
        };
        for (const headline of headlines) {
            grouped[headline.source].push(headline);
        }
        return grouped;
    }
    normalizeTitle(title) {
        return title
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    generateContentHash(title, url) {
        const content = `${title}|${url}`;
        return crypto_1.default.createHash('sha256').update(content).digest('hex');
    }
    async getCrossPlatformStories() {
        return await this.db.getCrossPlatformStories();
    }
    async getRecentHeadlines(hours = 12) {
        return await this.db.getRecentHeadlines(hours);
    }
    close() {
        this.db.close();
    }
}
exports.PersistenceMerger = PersistenceMerger;
