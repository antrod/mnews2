import sqlite3 from 'sqlite3';
import { Headline, CrossPlatformStory } from './types';

export class NewsDatabase {
  private db: sqlite3.Database;

  constructor(dbPath: string = './news.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    const createTables = `
      CREATE TABLE IF NOT EXISTS headlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE,
        source TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        popularity INTEGER NOT NULL,
        points INTEGER,
        commentCount INTEGER,
        hn_discussion_url TEXT,
        contentHash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cross_platform_stories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        techmeme_url TEXT,
        hackernews_url TEXT,
        summary TEXT,
        first_seen DATETIME NOT NULL,
        techmeme_headline_id INTEGER,
        hackernews_headline_id INTEGER,
        FOREIGN KEY (techmeme_headline_id) REFERENCES headlines(id),
        FOREIGN KEY (hackernews_headline_id) REFERENCES headlines(id)
      );

      CREATE INDEX IF NOT EXISTS idx_headlines_source_timestamp ON headlines(source, timestamp);
      CREATE INDEX IF NOT EXISTS idx_headlines_timestamp ON headlines(timestamp);
      CREATE INDEX IF NOT EXISTS idx_cross_stories_first_seen ON cross_platform_stories(first_seen);
    `;

    this.db.exec(createTables);
  }

  insertHeadline(headline: Omit<Headline, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO headlines (
          title, url, source, timestamp, popularity, points, commentCount, hn_discussion_url, contentHash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        headline.title,
        headline.url,
        headline.source,
        headline.timestamp.toISOString(),
        headline.popularity,
        headline.points,
        headline.commentCount,
        headline.hnDiscussionUrl,
        headline.contentHash,
        function(err: Error | null) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getRecentHeadlines(hours: number = 12): Promise<Headline[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM headlines 
        WHERE timestamp > datetime('now', '-${hours} hours')
        ORDER BY timestamp DESC
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const headlines = rows.map(row => ({
            ...row,
            timestamp: new Date(row.timestamp)
          }));
          resolve(headlines);
        }
      });
    });
  }

  insertCrossPlatformStory(story: Omit<CrossPlatformStory, 'id'>): Promise<void> {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO cross_platform_stories (
          title, techmeme_url, hackernews_url, summary, first_seen, techmeme_headline_id, hackernews_headline_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        story.title,
        story.techmemeUrl,
        story.hackernewsUrl,
        story.summary,
        story.firstSeen.toISOString(),
        story.techmemeHeadlineId,
        story.hackernewsHeadlineId,
        function(err: Error | null) {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  getCrossPlatformStories(): Promise<CrossPlatformStory[]> {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM cross_platform_stories 
        ORDER BY first_seen DESC
      `, (err, rows: any[]) => {
        if (err) reject(err);
        else {
          const stories = rows.map(row => ({
            ...row,
            firstSeen: new Date(row.firstSeen)
          }));
          resolve(stories);
        }
      });
    });
  }

  close(): void {
    this.db.close();
  }
}