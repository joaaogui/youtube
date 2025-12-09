export interface VideoData {
  videoId: string;
  title: string;
  days: number;
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  score: number;
  url: string;
  thumbnail: string;
  description: string;
}

export interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: {
      url: string;
    };
  };
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

