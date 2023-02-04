<script setup>
// mucao UCGwXFpbp5uzecUbi3m7aRsw
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre UC50nGMsjEVjeiZAabzcPZ0g
// 1 video UC1xXdgoZjZpD-Uql3Dl5yfQ
// luiz do som UCFJvAGjel1N2QWyOu50pNeQ

import { ref, computed } from "vue";
import axios from "axios";
import dayjs from "dayjs";

// data
const videos = ref([]);
const loading = ref(false);
const channelName = ref("");
const channelInfo = ref(null);
const inputSearched = ref(null);

const apiUrl = "https://www.googleapis.com/youtube/v3";
const urlKey = "AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0";
const headers = [
  { text: "Título", value: "title", sortable: true },
  { text: "Idade (dias)", value: "days", sortable: true },
  { text: "Pontuação", value: "score", sortable: true },
  { text: "Visualizações", value: "views", sortable: true },
  { text: "Likes", value: "likes", sortable: true },
  { text: "Comentários", value: "comments", sortable: true },
  { text: "Favoritos", value: "favorites", sortable: true },
];
const videoPrefix = "https://www.youtube.com/watch?v=";
const channelPrefix = "https://www.youtube.com/channel/";
let allPlaylistVideos = [];

// computed
// methods
async function getPlaylistItems(playlistId, pageToken = "") {
  const getPlaylistVideosUrl = `${apiUrl}/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${urlKey}&pageToken=${pageToken}`;
  const playlistVideos = await axios.get(`${getPlaylistVideosUrl}`);
  pageToken = playlistVideos.data.nextPageToken;

  allPlaylistVideos.push(...playlistVideos.data.items);

  if (pageToken) {
    await getPlaylistItems(playlistId, pageToken);
  }
  return allPlaylistVideos;
}

function getDaysToToday(videoDate) {
  const today = dayjs();
  return today.diff(videoDate, "day");
}

async function getVideo(videoId) {
  const videoViewsUrl = `${apiUrl}/videos?part=statistics&id=${videoId}&key=${urlKey}`;
  return await axios.get(videoViewsUrl);
}

async function getVideoInfo(videoId, attribute = "viewCount") {
  const storage = localStorage.getItem(videoId);
  let statistics;
  if (storage) {
    statistics = JSON.parse(storage);
  } else {
    const video = await getVideo(videoId);
    statistics = video.data.items[0].statistics;
    localStorage.setItem(videoId, JSON.stringify(statistics));
  }
  return Number(statistics[attribute]);
}

async function getChannelVideos(channelId) {
  const getChannelUrl = `${apiUrl}/channels?part=contentDetails&id=${channelId}&key=${urlKey}`;
  const channel = await axios.get(getChannelUrl);
  const allUploadsPlaylistId =
    channel.data.items[0].contentDetails.relatedPlaylists.uploads;
  const channelVideos = await getPlaylistItems(allUploadsPlaylistId);
  return channelVideos;
}

async function setVideoArray() {
  const channelId = channelInfo.value.channelId;
  const channelVideos = await getChannelVideos(channelInfo.value.channelId);
  for (const video of channelVideos) {
    const videoContent = video.contentDetails;
    const videoId = videoContent.videoId;
    const views = await getVideoInfo(videoContent.videoId, "viewCount");
    const likes = await getVideoInfo(videoContent.videoId, "likeCount");
    const comments = await getVideoInfo(videoContent.videoId, "commentCount");
    const favorites = await getVideoInfo(videoContent.videoId, "favoriteCount");
    const days = getDaysToToday(videoContent.videoPublishedAt);
    const score = Number((views / days).toFixed(2));
    const title = video.snippet.title;
    const url = videoPrefix + videoContent.videoId;
    const thumbnail = video.snippet.thumbnails.default.url;
    videos.value.push({
      videoId,
      title,
      days,
      views,
      likes,
      comments,
      favorites,
      score,
      url,
      thumbnail,
    });
  }
  localStorage.setItem(channelId, JSON.stringify(videos.value));
}

const setChannelInfo = async (name) => {
  const searchChannelUrl = `${apiUrl}/search?part=snippet&q=${name}&type=channel&key=${urlKey}`;
  const result = await axios.get(searchChannelUrl);
  const channel = result.data.items[0];
  channelInfo.value = channel.snippet;
};

async function searchChannel(name) {
  loading.value = true;
  videos.value = [];
  allPlaylistVideos = [];
  inputSearched.value = name;
  await setChannelInfo(name);
  const storage = localStorage.getItem(channelInfo.value.channelId);
  if (storage) videos.value = JSON.parse(storage);
  else await setVideoArray();
  loading.value = false;
}
</script>

<template>
  <div class="flex flex-col w-full p-4">
    <input
      class="border-4 border-gray-500 bg-gray-400"
      v-model="channelName"
      @keypress.enter="searchChannel(channelName)"
    />
    <a v-if="channelInfo" :href="`${channelPrefix}${channelInfo.channelId}`">
      {{ channelInfo.channelTitle }}
      <img :src="channelInfo.thumbnails.medium.url" />
    </a>
    <EasyDataTable
      :headers="headers"
      :items="videos"
      :rows-per-page="100"
      :loading="loading"
    >
      <template #item-title="{ url, title, thumbnail }">
        <!--        <img :src="thumbnail" />-->

        <a :href="url" target="_blank">{{ title }}</a></template
      >
      <template #item-score="{ score }"
        ><span v-if="score">
          {{ parseInt(score).toLocaleString("pt-BR") }}</span
        ></template
      >
      <template #item-views="{ views }"
        ><span v-if="views">
          {{ views.toLocaleString("pt-BR") }}</span
        ></template
      >
    </EasyDataTable>
  </div>
</template>
