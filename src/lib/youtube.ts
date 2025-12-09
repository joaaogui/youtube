import axios from "axios";
import dayjs from "dayjs";
import type { VideoData, ChannelInfo, PlaylistItem, VideoStatistics } from "@/types/youtube";

const API_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "AIzaSyBy5PsZmq3zn2jSdnrn1bGT9lsF-6NwVx4";
const VIDEO_PREFIX = "https://www.youtube.com/watch?v=";
const CHANNEL_PREFIX = "https://www.youtube.com/channel/";

export { CHANNEL_PREFIX };

async function getPlaylistItems(playlistId: string, pageToken = ""): Promise<PlaylistItem[]> {
  const allPlaylistVideos: PlaylistItem[] = [];
  
  const fetchPage = async (token: string): Promise<void> => {
    const url = `${API_URL}/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${token}`;
    const response = await axios.get(url);
    allPlaylistVideos.push(...response.data.items);
    
    if (response.data.nextPageToken) {
      await fetchPage(response.data.nextPageToken);
    }
  };
  
  await fetchPage(pageToken);
  return allPlaylistVideos;
}

function getDaysToToday(videoDate: string): number {
  const today = dayjs();
  return today.diff(videoDate, "day");
}

async function getVideoStatistics(videoId: string): Promise<VideoStatistics> {
  const cacheKey = `video_stats_${videoId}`;
  
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }
  
  const url = `${API_URL}/videos?part=statistics&id=${videoId}&key=${API_KEY}`;
  const response = await axios.get(url);
  const statistics = response.data.items[0]?.statistics;
  
  if (typeof window !== "undefined" && statistics) {
    localStorage.setItem(cacheKey, JSON.stringify(statistics));
  }
  
  return statistics;
}

function getScore(views: number, days: number, comments: number, likes: number): number {
  return Number((views * 4) / ((days + 1) * 5) + comments * 2 + likes * 3);
}

async function getChannelVideos(channelId: string): Promise<PlaylistItem[]> {
  const url = `${API_URL}/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`;
  const response = await axios.get(url);
  const uploadsPlaylistId = response.data.items[0]?.contentDetails?.relatedPlaylists?.uploads;
  
  if (!uploadsPlaylistId) {
    throw new Error("Could not find uploads playlist");
  }
  
  return getPlaylistItems(uploadsPlaylistId);
}

export async function searchChannel(query: string): Promise<ChannelInfo> {
  const url = `${API_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&key=${API_KEY}`;
  const response = await axios.get(url);
  const channel = response.data.items[0];
  
  if (!channel) {
    throw new Error("Channel not found");
  }
  
  return channel.snippet;
}

export async function fetchChannelVideos(
  channelId: string,
  onProgress?: (current: number, total: number) => void
): Promise<VideoData[]> {
  const cacheKey = `channel_videos_${channelId}`;
  
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }
  
  const channelVideos = await getChannelVideos(channelId);
  const videos: VideoData[] = [];
  
  for (let i = 0; i < channelVideos.length; i++) {
    const video = channelVideos[i];
    const videoContent = video.contentDetails;
    const videoId = videoContent.videoId;
    
    try {
      const stats = await getVideoStatistics(videoId);
      const views = Number(stats?.viewCount || 0);
      const likes = Number(stats?.likeCount || 0);
      const comments = Number(stats?.commentCount || 0);
      const favorites = Number(stats?.favoriteCount || 0);
      const days = getDaysToToday(videoContent.videoPublishedAt);
      const score = getScore(views, days, comments, likes);
      
      videos.push({
        videoId,
        title: video.snippet.title,
        days,
        views,
        likes,
        comments,
        favorites,
        score,
        url: VIDEO_PREFIX + videoId,
        thumbnail: video.snippet.thumbnails.default.url,
        description: video.snippet.description,
      });
      
      onProgress?.(i + 1, channelVideos.length);
    } catch (error) {
      console.error(`Error fetching stats for video ${videoId}:`, error);
    }
  }
  
  if (typeof window !== "undefined" && videos.length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify(videos));
  }
  
  return videos;
}

