"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RssGenerator = void 0;
const rss_1 = __importDefault(require("rss"));
class RssGenerator {
    generate(crossStories, unmatchedHeadlines) {
        const allStories = this.prioritizeStories(crossStories, unmatchedHeadlines);
        const topStories = allStories.slice(0, 10);
        const feed = new rss_1.default({
            title: 'mnews2 - Tech News Aggregator',
            description: 'Cross-platform tech news aggregator identifying trending stories across multiple sources',
            feed_url: 'https://antrod.github.io/mnews2/feed.xml',
            site_url: 'https://antrod.github.io/mnews2/',
            language: 'en',
            pubDate: new Date(),
            ttl: 60
        });
        for (const story of topStories) {
            if ('summary' in story) {
                this.addCrossPlatformStory(feed, story);
            }
            else {
                this.addHeadline(feed, story);
            }
        }
        return feed.xml({ indent: true });
    }
    prioritizeStories(crossStories, unmatchedHeadlines) {
        const prioritized = [];
        prioritized.push(...crossStories);
        const hnHeadlines = unmatchedHeadlines.filter(h => h.source === 'hackernews');
        const techmemeHeadlines = unmatchedHeadlines.filter(h => h.source === 'techmeme');
        const macHeadlines = unmatchedHeadlines.filter(h => h.source === '9to5mac');
        const maxLength = Math.max(hnHeadlines.length, techmemeHeadlines.length, macHeadlines.length);
        for (let i = 0; i < maxLength; i++) {
            if (hnHeadlines[i])
                prioritized.push(hnHeadlines[i]);
            if (techmemeHeadlines[i])
                prioritized.push(techmemeHeadlines[i]);
            if (macHeadlines[i])
                prioritized.push(macHeadlines[i]);
        }
        return prioritized;
    }
    addCrossPlatformStory(feed, story) {
        const description = story.summary
            ? `${story.summary}<br/><br/>Sources: ${this.formatSources(story)}`
            : `Cross-platform story from ${this.formatSources(story)}`;
        feed.item({
            title: `🔥 ${story.title}`,
            description,
            url: story.techmemeUrl || story.hackernewsUrl || '',
            guid: `cross-${story.id || 'unknown'}`,
            date: story.firstSeen,
            categories: ['multi-source', 'tech-news']
        });
    }
    addHeadline(feed, headline) {
        let description = `Source: ${headline.source}`;
        if (headline.points) {
            description += `<br/>Points: ${headline.points}`;
        }
        if (headline.commentCount) {
            description += `<br/>Comments: ${headline.commentCount}`;
        }
        if (headline.hnDiscussionUrl) {
            description += `<br/><a href="${headline.hnDiscussionUrl}">Discussion</a>`;
        }
        feed.item({
            title: headline.title,
            description,
            url: headline.url,
            guid: `${headline.source}-${headline.id || 'unknown'}`,
            date: headline.timestamp,
            categories: [headline.source, 'tech-news']
        });
    }
    formatSources(story) {
        const sources = [];
        if (story.techmemeUrl)
            sources.push('<a href="https://www.techmeme.com">Techmeme</a>');
        if (story.hackernewsUrl)
            sources.push('<a href="https://news.ycombinator.com">Hacker News</a>');
        return sources.join(' • ');
    }
}
exports.RssGenerator = RssGenerator;
