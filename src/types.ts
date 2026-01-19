export interface Headline {
  id?: number;
  title: string;
  url: string;
  source: 'techmeme' | 'hackernews' | '9to5mac';
  timestamp: Date;
  popularity: number;
  points?: number;
  commentCount?: number;
  hnDiscussionUrl?: string;
  contentHash: string;
}

export interface CrossPlatformStory {
  id?: number;
  title: string;
  techmemeUrl?: string;
  hackernewsUrl?: string;
  summary?: string;
  firstSeen: Date;
  techmemeHeadlineId?: number;
  hackernewsHeadlineId?: number;
}

export interface ScrapedHeadline {
  title: string;
  url: string;
  popularity: number;
  points?: number;
  commentCount?: number;
  hnDiscussionUrl?: string;
}

export type Source = 'techmeme' | 'hackernews' | '9to5mac';