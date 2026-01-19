# mnews2 - Technical Specification

## Overview
A tech news aggregator that scrapes headlines from three sources, identifies cross-source stories, and publishes a static site via GitHub Pages.

## Architecture

**Stack**
- TypeScript/Node.js backend
- SQLite database (better-sqlite3)
- Static HTML/RSS output
- GitHub Actions for hourly updates
- GitHub Pages for hosting

## Data Sources

| Source | Method | Popularity Metric |
|--------|--------|-------------------|
| Techmeme | HTML scrape | Position (lower = better) |
| Hacker News | Algolia API | Points (higher = better) |
| 9to5Mac | RSS feed | Comment count (higher = better) |

**9to5Mac Filtering**
- Excludes posts where `dc:creator` contains "sponsored"
- Parses `slash:comments` for comment count

## Database Schema

**headlines table**
- `id`, `title`, `url`, `source`, `timestamp`, `popularity`, `points`, `commentCount`, `hn_discussion_url`, `contentHash`

**cross_platform_stories table**
- `id`, `title`, `techmeme_url`, `hackernews_url`, `summary`, `first_seen`, `techmeme_headline_id`, `hackernews_headline_id`

## Matching Algorithm

1. Store all fresh headlines from each source
2. Query headlines within 12-hour time window
3. Compare titles using string similarity (threshold: 0.5)
4. Match stories appearing in 2+ different sources
5. Generate AI summary for cross-source matches via OpenAI API

## Output Generation

**Feed Priority**
1. Cross-source stories (2+ sources) at top
2. Unmatched stories interleaved: HN → Techmeme → 9to5Mac

**RSS Feed** (`feed.xml`)
- Top 10 stories
- Cross-source stories include AI-generated summary

**HTML Page** (`index.html`)
- Top 10 stories
- Badges: 🔥 for multi-source, colored badges for single source
- Clickable comment links for HN and 9to5Mac
- Responsive, minimal design

## Badge Styling

| Source | Background | Text Color |
|--------|------------|------------|
| Multi-source | #667eea | white |
| Hacker News | #ffeee5 | #ff6600 |
| Techmeme | #e5f2ff | #007aff |
| 9to5Mac | #f3e5ff | #9c27b0 |

## Deployment

**GitHub Actions Workflow**
- Runs hourly via cron (`0 * * * *`)
- Manual trigger supported (`workflow_dispatch`)
- Concurrency: single deployment at a time
- Commits database updates back to repo
- Deploys to GitHub Pages

**URLs**
- Site: `https://antrod.github.io/mnews2/`
- Feed: `https://antrod.github.io/mnews2/feed.xml`

## Key Files

```
src/
├── index.ts              # Main entry point
├── types.ts              # TypeScript interfaces
├── db.ts                 # SQLite database operations
├── persistence-merger.ts # Matching logic & storage
├── html-generator.ts     # Static HTML generation
├── rss-generator.ts      # RSS feed generation
└── scrapers/
    ├── techmeme.ts       # Techmeme HTML scraper
    ├── hackernews.ts     # HN Algolia API client
    └── 9to5mac.ts        # 9to5Mac RSS parser
```

## Dependencies

- `axios` - HTTP requests
- `cheerio` - HTML/XML parsing
- `better-sqlite3` - SQLite database
- `rss` - RSS feed generation
- `openai` - AI summaries
- `chalk` - CLI output styling
- `string-similarity` - Title matching
