"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlGenerator = void 0;
class HtmlGenerator {
    generate(crossStories, unmatchedHeadlines) {
        const allStories = this.prioritizeStories(crossStories, unmatchedHeadlines);
        const topStories = allStories.slice(0, 10);
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>mnews2 - Tech News Aggregator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-radius: 10px;
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .stories {
            list-style: none;
        }
        
        .story {
            background: white;
            margin-bottom: 20px;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .story:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .story-title {
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        
        .story-title a {
            color: #333;
            text-decoration: none;
        }
        
        .story-title a:hover {
            color: #667eea;
        }
        
        .story-summary {
            color: #666;
            margin-bottom: 15px;
            font-style: italic;
        }
        
        .story-meta {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .badge-multi {
            background: #667eea;
            color: white;
        }
        
        .badge-hn {
            background: #ffeee5;
            color: #ff6600;
        }
        
        .badge-techmeme {
            background: #e5f2ff;
            color: #007aff;
        }
        
        .badge-9to5mac {
            background: #f3e5ff;
            color: #9c27b0;
        }
        
        .comments-link {
            font-size: 0.9rem;
            color: #666;
            text-decoration: none;
            padding: 4px 8px;
            border-radius: 4px;
            background: #f0f0f0;
        }
        
        .comments-link:hover {
            background: #e0e0e0;
            color: #333;
        }
        
        .fire {
            color: #ff6b35;
            margin-right: 5px;
        }
        
        footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            color: #666;
            font-size: 0.9rem;
        }
        
        .feed-link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        
        .feed-link:hover {
            text-decoration: underline;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 10px;
            }
            
            h1 {
                font-size: 2rem;
            }
            
            .story {
                padding: 15px;
            }
            
            .story-title {
                font-size: 1.1rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>mnews2</h1>
            <p class="subtitle">Cross-platform tech news aggregator</p>
        </header>
        
        <main>
            <ul class="stories">
                ${topStories.map(story => this.renderStory(story)).join('')}
            </ul>
        </main>
        
        <footer>
            <p>Updated ${new Date().toLocaleString()}</p>
            <p><a href="/feed.xml" class="feed-link">RSS Feed</a></p>
        </footer>
    </div>
</body>
</html>`;
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
    renderStory(story) {
        if ('summary' in story) {
            return this.renderCrossPlatformStory(story);
        }
        else {
            return this.renderHeadline(story);
        }
    }
    renderCrossPlatformStory(story) {
        const links = [];
        if (story.techmemeUrl)
            links.push(`<a href="${story.techmemeUrl}">Techmeme</a>`);
        if (story.hackernewsUrl)
            links.push(`<a href="${story.hackernewsUrl}">Hacker News</a>`);
        return `
      <li class="story">
        <h2 class="story-title">
          <span class="fire">🔥</span>
          <a href="${story.techmemeUrl || story.hackernewsUrl}">${story.title}</a>
        </h2>
        ${story.summary ? `<p class="story-summary">${story.summary}</p>` : ''}
        <div class="story-meta">
          <span class="badge badge-multi">Multi-source</span>
          <span class="sources">${links.join(' • ')}</span>
        </div>
      </li>
    `;
    }
    renderHeadline(headline) {
        const badgeClass = `badge-${headline.source.replace('9to5mac', '9to5mac').replace('hackernews', 'hn')}`;
        const sourceName = headline.source.charAt(0).toUpperCase() + headline.source.slice(1).replace('9to5mac', '9to5Mac');
        let commentsLink = '';
        if (headline.hnDiscussionUrl) {
            commentsLink = `<a href="${headline.hnDiscussionUrl}" class="comments-link">Comments (${headline.points || 0})</a>`;
        }
        else if (headline.commentCount && headline.commentCount > 0) {
            commentsLink = `<span class="comments-link">Comments (${headline.commentCount})</span>`;
        }
        return `
      <li class="story">
        <h2 class="story-title">
          <a href="${headline.url}">${headline.title}</a>
        </h2>
        <div class="story-meta">
          <span class="badge ${badgeClass}">${sourceName}</span>
          ${commentsLink}
        </div>
      </li>
    `;
    }
}
exports.HtmlGenerator = HtmlGenerator;
