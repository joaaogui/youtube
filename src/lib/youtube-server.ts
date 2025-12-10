import axios from "axios";
import dayjs from "dayjs";
import type { VideoData, PlaylistItem, VideoStatistics } from "@/types/youtube";
import { calculateVideoScore } from "./scoring";

const API_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.YOUTUBE_API_KEY;
const VIDEO_PREFIX = "https://www.youtube.com/watch?v=";

// YouTube API allows up to 50 IDs per request
const BATCH_SIZE = 50;

export interface ChannelInfo {
  channelId: string;
  channelTitle: string;
  thumbnails: {
    default: {
      url: string;
    };
  };
}

function getApiKey(): string {
  if (!API_KEY) {
    throw new Error("YouTube API key not configured");
  }
  return API_KEY;
}

/**
 * Fetch all videos from a playlist with pagination
 */
async function getPlaylistItems(playlistId: string): Promise<PlaylistItem[]> {
  const apiKey = getApiKey();
  const allVideos: PlaylistItem[] = [];
  let pageToken = "";

  do {
    const url = `${API_URL}/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const response = await axios.get(url);
    allVideos.push(...response.data.items);
    pageToken = response.data.nextPageToken || "";
  } while (pageToken);

  return allVideos;
}

/**
 * Fetch statistics for multiple videos in a single API call
 */
async function getBatchVideoStatistics(videoIds: string[]): Promise<Map<string, VideoStatistics>> {
  const apiKey = getApiKey();
  const statsMap = new Map<string, VideoStatistics>();

  // Fetch in batches of 50
  for (let i = 0; i < videoIds.length; i += BATCH_SIZE) {
    const batch = videoIds.slice(i, i + BATCH_SIZE);
    const ids = batch.join(",");
    
    const url = `${API_URL}/videos?part=statistics&id=${ids}&key=${apiKey}`;
    const response = await axios.get(url);
    
    for (const item of response.data.items) {
      const stats = item.statistics as VideoStatistics;
      statsMap.set(item.id, stats);
    }
  }

  return statsMap;
}

function getDaysToToday(videoDate: string): number {
  return dayjs().diff(videoDate, "day");
}

/**
 * Get the uploads playlist ID for a channel
 */
async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const apiKey = getApiKey();
  const url = `${API_URL}/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
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
  const apiKey = getApiKey();
  const url = `${API_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${apiKey}`;
  const response = await axios.get(url);
  const channel = response.data.items[0];
  
  if (!channel) {
    throw new Error("Channel not found");
  }
  
  return channel.snippet;
}

/**
 * Fetch all videos from a channel with batched statistics
 */
export async function fetchChannelVideos(channelId: string): Promise<VideoData[]> {
  // Step 1: Get uploads playlist ID
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  
  // Step 2: Fetch all playlist items
  const playlistItems = await getPlaylistItems(uploadsPlaylistId);

  // Step 3: Extract all video IDs
  const videoIds = playlistItems.map(item => item.contentDetails.videoId);
  
  // Step 4: Batch fetch all statistics
  const statsMap = await getBatchVideoStatistics(videoIds);
  
  // Step 5: Build the video data array
  const videos: VideoData[] = [];
  
  for (const item of playlistItems) {
    const videoId = item.contentDetails.videoId;
    const stats = statsMap.get(videoId);
    
    if (stats) {
      const views = Number(stats.viewCount || 0);
      const likes = Number(stats.likeCount || 0);
      const comments = Number(stats.commentCount || 0);
      const favorites = Number(stats.favoriteCount || 0);
      const days = getDaysToToday(item.contentDetails.videoPublishedAt);
      
      // Calculate comprehensive score using statistical model
      const scoring = calculateVideoScore({ views, likes, comments, days });
      
      videos.push({
        videoId,
        title: item.snippet.title,
        days,
        views,
        likes,
        comments,
        favorites,
        score: scoring.score,
        scoreComponents: scoring.components,
        rates: scoring.rates,
        url: VIDEO_PREFIX + videoId,
        thumbnail: item.snippet.thumbnails.default.url,
        description: item.snippet.description,
      });
    }
  }

  return videos;
}

