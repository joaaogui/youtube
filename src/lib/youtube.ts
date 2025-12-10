import type { VideoData } from "@/types/youtube";

export const CHANNEL_PREFIX = "https://www.youtube.com/channel/";

export interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: {
      url: string;
    };
  };
}

/**
 * Search for a channel by name/query via API route
 */
export async function searchChannel(query: string): Promise<ChannelInfo> {
  const response = await fetch(`/api/youtube/search/${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to search channel");
  }
  
  return response.json();
}

/**
 * Fetch all videos from a channel via API route
 * Includes client-side caching with localStorage
 */
export async function fetchChannelVideos(
  channelId: string,
  onProgress?: (current: number, total: number) => void
): Promise<VideoData[]> {
  const cacheKey = `channel_videos_${channelId}`;
  
  // Check cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const videos = JSON.parse(cached);
      onProgress?.(videos.length, videos.length);
      return videos;
    }
  }

  // Show indeterminate progress while fetching
  onProgress?.(0, 0);
  
  const response = await fetch(`/api/youtube/channel/${channelId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch channel videos");
  }
  
  const videos: VideoData[] = await response.json();
  
  // Update progress
  onProgress?.(videos.length, videos.length);
  
  // Cache the result
  if (typeof window !== "undefined" && videos.length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify(videos));
  }

  return videos;
}

/**
 * Clear cache for a specific channel or all channels
 */
export function clearCache(channelId?: string): void {
  if (typeof window === "undefined") return;
  
  if (channelId) {
    localStorage.removeItem(`channel_videos_${channelId}`);
  } else {
    // Clear all YouTube-related cache
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith("video_stats_") || key.startsWith("channel_videos_")) {
        localStorage.removeItem(key);
      }
    }
  }
}
