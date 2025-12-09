export interface ScoreComponents {
  engagementScore: number;
  reachScore: number;
  consistencyScore: number;
  communityScore: number;
}

export interface EngagementRates {
  likeRate: number;
  commentRate: number;
  engagementRate: number;
  viewsPerDay: number;
}

export interface VideoData {
  videoId: string;
  title: string;
  days: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  /** Composite score (0-100) */
  score: number;
  /** Individual score components */
  scoreComponents: ScoreComponents;
  /** Engagement rates per 1000 views */
  rates: EngagementRates;
  url: string;
  thumbnail: string;
  description: string;
}

export interface PlaylistItem {
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
  contentDetails: {
    videoId: string;
    videoPublishedAt: string;
  };
}

export interface VideoStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
  favoriteCount: string;
}
