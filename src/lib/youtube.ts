import axios from "axios";
import dayjs from "dayjs";
import type { VideoData, PlaylistItem, VideoStatistics } from "@/types/youtube";

const API_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBy5PsZmq3zn2jSdnrn1bGT9lsF-6NwVx4";
const VIDEO_PREFIX = "https://www.youtube.com/watch?v=";
const CHANNEL_PREFIX = "https://www.youtube.com/channel/";

// YouTube API allows up to 50 IDs per request
const BATCH_SIZE = 50;

export { CHANNEL_PREFIX };

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
 * Fetch all videos from a playlist with pagination
 */
async function getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const allVideos: PlaylistItem[] = [];
  let pageToken = "";

  do {
    const url = `${API_URL}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const response = await axios.get(url);
    allVideos.push(...response.data.items);
    pageToken = response.data.nextPageToken || "";
  } while (pageToken);

  return allVideos;
}

/**
 * OPTIMIZED: Fetch statistics for multiple videos in a single API call
 * YouTube API allows up to 50 video IDs per request
 */
async function getBatchVideoStatistics(videoIds: string[]): Promise<Map<string, VideoStatistics>> {
  const statsMap = new Map<string, VideoStatistics>();
  
  // Check cache first
  const uncachedIds: string[] = [];
  
  if (typeof window !== "undefined") {
    for (const id of videoIds) {
      const cached = localStorage.getItem(`video_stats_${id}`);
      if (cached) {
        statsMap.set(id, JSON.parse(cached));
      } else {
        uncachedIds.push(id);
      }
    }
  } else {
    uncachedIds.push(...videoIds);
  }

  // Fetch uncached videos in batches of 50
  for (let i = 0; i < uncachedIds.length; i += BATCH_SIZE) {
    const batch = uncachedIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(",");
    
    const url = `${API_URL}/videos?part=statistics&id=${ids}&key=${API_KEY}`;
    const response = await axios.get(url);
    
    for (const item of response.data.items) {
      const stats = item.statistics as VideoStatistics;
      statsMap.set(item.id, stats);
      
      // Cache the result
      if (typeof window !== "undefined") {
        localStorage.setItem(`video_stats_${item.id}`, JSON.stringify(stats));
      }
    }
  }

  return statsMap;
}

function getDaysToToday(videoDate: string): number {
  return dayjs().diff(videoDate, "day");
}

function getScore(views: number, days: number, comments: number, likes: number): number {
  return Number((views * 4) / ((days + 1) * 5) + comments * 2 + likes * 3);
}

/**
 * Get the uploads playlist ID for a channel
 */
async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const url = `${API_URL}/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
  const response = await axios.get(url);
  const uploadsPlaylistId = response.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }
  
  return uploadsPlaylistId;
}

/**
 * Search for a channel by name/query
 */
export async function searchChannel(query: string): Promise<ChannelInfo> {
  const url = `${API_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${API_KEY}`;
  const response = await axios.get(url);
  const channel = response.data.items[0];
  
  if (!channel) {
    throw new Error("Channel not found");
  }
  
  return channel.snippet;
}

/**
 * OPTIMIZED: Fetch all videos from a channel with batched statistics
 * 
 * Performance improvements:
 * 1. Fetch all playlist items first (1 API call per 50 videos)
 * 2. Batch fetch statistics for all videos (1 API call per 50 videos)
 * 3. Use localStorage cache to avoid redundant API calls
 * 
 * For a channel with 100 videos:
 * - OLD: 100+ API calls (1 per video for stats)
 * - NEW: 4 API calls (2 for playlist + 2 for stats)
 */
export async function fetchChannelVideos(
  channelId: string,
  onProgress?: (current: number, total: number) => void
): Promise<VideoData[]> {
  const cacheKey = `channel_videos_${channelId}`;
  
  // Check full channel cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const videos = JSON.parse(cached);
      onProgress?.(videos.length, videos.length);
      return videos;
    }
  }

  // Step 1: Get uploads playlist ID (1 API call)
  onProgress?.(0, 0);
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  
  // Step 2: Fetch all playlist items (1 API call per 50 videos)
  const playlistItems = await getPlaylistItems(uploadsPlaylistId);
  const totalVideos = playlistItems.length;
  onProgress?.(0, totalVideos);

  // Step 3: Extract all video IDs
  const videoIds = playlistItems.map(item => item.contentDetails.videoId);
  
  // Step 4: BATCH fetch all statistics (1 API call per 50 videos)
  // This is the key optimization - instead of N calls, we make N/50 calls
  const statsMap = await getBatchVideoStatistics(videoIds);
  
  // Step 5: Build the video data array
  const videos: VideoData[] = [];
  
  for (let i = 0; i < playlistItems.length; i++) {
    const item = playlistItems[i];
    const videoId = item.contentDetails.videoId;
    const stats = statsMap.get(videoId);
    
    if (stats) {
      const views = Number(stats.viewCount || 0);
      const likes = Number(stats.likeCount || 0);
      const comments = Number(stats.commentCount || 0);
      const favorites = Number(stats.favoriteCount || 0);
      const days = getDaysToToday(item.contentDetails.videoPublishedAt);
      const score = getScore(views, days, comments, likes);
      
      videos.push({
        videoId,
        title: item.snippet.title,
        days,
        views,
        likes,
        comments,
        favorites,
        score,
        url: VIDEO_PREFIX + videoId,
        thumbnail: item.snippet.thumbnails.default.url,
        description: item.snippet.description,
      });
    }
    
    // Update progress
    onProgress?.(i + 1, totalVideos);
  }

  // Cache the full result
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
