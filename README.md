# mnews2

Tech news aggregator that identifies cross-source stories from Techmeme, Hacker News, and 9to5Mac.

## Features

- Scrapes headlines from three major tech news sources
- Identifies stories appearing across multiple platforms
- Generates AI-powered summaries for cross-source stories
- Publishes static HTML site and RSS feed
- Automatic hourly updates via GitHub Actions

## Sources

- **Techmeme** - HTML scraping (position-based popularity)
- **Hacker News** - Algolia API (points-based popularity)  
- **9to5Mac** - RSS feed (comment count popularity)

## Architecture

- TypeScript/Node.js backend
- SQLite database with better-sqlite3
- Static HTML/RSS output
- GitHub Actions for hourly updates
- GitHub Pages hosting

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run locally (requires OPENAI_API_KEY env var)
OPENAI_API_KEY=your_key npm start

# Development mode
npm run dev
```

## Deployment

The site is automatically deployed to GitHub Pages at:
- https://antrod.github.io/mnews2/
- RSS: https://antrod.github.io/mnews2/feed.xml

## License

MIT