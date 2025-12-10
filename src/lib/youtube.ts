import type { VideoData } from "@/types/youtube";

export const CHANNEL_PREFIX = "https://www.youtube.com/channel/";

// YouTube API ToS requires refreshing cached data within 30 days
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

interface CachedData<T> {
  data: T;
  timestamp: number;
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

/**
 * Check if cached data is still valid (less than 30 days old)
 */
function isCacheValid<T>(cached: CachedData<T> | null): cached is CachedData<T> {
  if (!cached || !cached.timestamp) return false;
  return Date.now() - cached.timestamp < CACHE_MAX_AGE_MS;
}

/**
 * Get cache age in days for display purposes
 */
export function getCacheAge(channelId: string): number | null {
  if (typeof window === "undefined") return null;
  
  const cacheKey = `channel_videos_${channelId}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (!cached) return null;
  
  try {
    const parsed = JSON.parse(cached) as CachedData<VideoData[]>;
    if (!parsed.timestamp) return null;
    return Math.floor((Date.now() - parsed.timestamp) / (24 * 60 * 60 * 1000));
  } catch {
    return null;
  }
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
 * Includes client-side caching with localStorage (30-day expiration per YouTube ToS)
 */
export async function fetchChannelVideos(
  channelId: string,
  onProgress?: (current: number, total: number) => void
): Promise<VideoData[]> {
  const cacheKey = `channel_videos_${channelId}`;
  
  // Check cache first (with 30-day expiration)
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as CachedData<VideoData[]>;
        if (isCacheValid(parsed)) {
          onProgress?.(parsed.data.length, parsed.data.length);
          return parsed.data;
        }
        // Cache expired, remove it
        localStorage.removeItem(cacheKey);
      } catch {
        // Invalid cache data, remove it
        localStorage.removeItem(cacheKey);
      }
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
  
  // Cache the result with timestamp
  if (typeof window !== "undefined" && videos.length > 0) {
    const cacheData: CachedData<VideoData[]> = {
      data: videos,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
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

/**
 * Clean up expired cache entries
 */
export function cleanupExpiredCache(): number {
  if (typeof window === "undefined") return 0;
  
  let cleaned = 0;
  const keys = Object.keys(localStorage);
  
  for (const key of keys) {
    if (key.startsWith("channel_videos_")) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const parsed = JSON.parse(cached) as CachedData<VideoData[]>;
          if (!isCacheValid(parsed)) {
            localStorage.removeItem(key);
            cleaned++;
          }
        }
      } catch {
        localStorage.removeItem(key);
        cleaned++;
      }
    }
  }
  
  return cleaned;
}
