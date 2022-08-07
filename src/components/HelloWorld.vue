<script setup lang="ts">
// mucao UCGwXFpbp5uzecUbi3m7aRsw
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre UC50nGMsjEVjeiZAabzcPZ0g

import { ref, onMounted, computed } from "vue";
import axios from "axios";
import dayjs from "dayjs";
import type { Header } from "vue3-easy-data-table";

// data
const videos: any = ref({});
const prop: any = ref("");
const lists: any = ref({
  byScore: { title: "Pontuação", data: [], labels: [] },
  byDays: { title: "Mais recente", data: [], labels: [] },
  byViews: { title: "Visualizações", data: [], labels: [] },
});
const apiUrl = "https://www.googleapis.com/youtube/v3";
const urlKey = "AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0";
const headers: Header[] = [
  { text: "Título", value: "title", sortable: true },
  { text: "Idade", value: "days", sortable: true },
  { text: "Ranking idade", value: "daysRanking", sortable: true },
  { text: "Pontuação", value: "score", sortable: true },
  { text: "Ranking Pontuação", value: "scoreRanking", sortable: true },
  { text: "Visualizações", value: "views", sortable: true },
  { text: "Ranking Visualizações", value: "viewsRanking", sortable: true },
  { text: "Soma dos rankings", value: "sum", sortable: true },
];
const loaded: any = ref(false);
const channelName: any = ref("");
const channelId: any = ref(null);
// computed
const daysProp = computed(() => {
  return prop.value === "days" || prop.value === "sum";
});

const allPlaylistVideos: any = [];

// methods
async function getPlaylistItems(playlistId: string, pageToken = "") {
  const getPlaylistVideosUrl = `${apiUrl}/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=${urlKey}&pageToken=${pageToken}`;
  const playlistVideos = await axios.get(`${getPlaylistVideosUrl}`);
  pageToken = playlistVideos.data.nextPageToken;
  allPlaylistVideos.push(...playlistVideos.data.items);

  if (pageToken) {
    await getPlaylistItems(playlistId, pageToken);
  }
  return allPlaylistVideos;
}

function sortVideos(a: any, b: any) {
  if (Number(a[prop.value]) < Number(b[prop.value])) {
    return daysProp.value ? -1 : 1;
  }
  if (Number(a[prop.value]) > Number(b[prop.value])) {
    return daysProp.value ? 1 : -1;
  }
  return 0;
}

function getDaysToToday(videoDate: any) {
  const today = dayjs();
  return today.diff(videoDate, "day");
}

async function getVideoViews(videoId: any) {
  const videoViewsUrl = `${apiUrl}/videos?part=statistics&id=${videoId}&key=${urlKey}`;
  const result = await axios.get(videoViewsUrl);
  return result.data.items[0].statistics.viewCount;
}

async function getChannelVideos(channelId: string) {
  const getChannelUrl = `${apiUrl}/channels?part=contentDetails&id=${channelId}&key=${urlKey}`;

  const channel = await axios.get(getChannelUrl);

  const allUploadsPlaylistId =
    channel.data.items[0].contentDetails.relatedPlaylists.uploads;

  return getPlaylistItems(allUploadsPlaylistId);
}
async function searchChannel(name: string) {
  const searchChannelUrl = `${apiUrl}/search?part=snippet&q=${name}&type=channel&key=${urlKey}`;
  const result = await axios.get(searchChannelUrl);
  const channel = result.data.items[0];
  channelId.value = channel.snippet.channelId;
  await doEverything();
  return result.data.items[0];
}

async function doEverything() {
  const channelVideos = await getChannelVideos(channelId.value);
  let temp = {};
  for (const video of channelVideos) {
    const videoId = video.contentDetails.videoId;
    const views = await getVideoViews(video.contentDetails.videoId);
    const days = getDaysToToday(video.contentDetails.videoPublishedAt);
    const score = Number((Number(views) / days).toFixed(2));
    const title = video.snippet.title;
    temp[videoId] = {
      videoId,
      title,
      days,
      views,
      score,
    };
  }
  const videoArray: [] = Object.keys(temp).map(function (key) {
    return temp[key];
  });

  prop.value = "score";
  const copyScore = [].concat(videoArray.sort(sortVideos));
  copyScore.forEach((video, index) => {
    temp[video.videoId].scoreRanking = index;
  });
  lists.value.byScore.prop = prop.value;
  lists.value.byScore.data = copyScore;

  prop.value = "days";
  const copyDays = [].concat(videoArray.sort(sortVideos));
  copyDays.forEach((video, index) => {
    temp[video.videoId].daysRanking = index;
  });
  lists.value.byDays.prop = prop.value;
  lists.value.byDays.data = copyDays;

  prop.value = "views";
  const copyViews = [].concat(videoArray.sort(sortVideos));
  copyViews.forEach((video, index) => {
    temp[video.videoId].viewsRanking = index;
  });
  lists.value.byViews.prop = prop.value;
  lists.value.byViews.data = copyViews;

  for (const video of videoArray) {
    const sum = video.scoreRanking + video.daysRanking + video.viewsRanking;
    temp[video.videoId].sum = sum;
    prop.value = "sum";
    videoArray.sort(sortVideos);
  }
  videos.value = videoArray;
  loaded.value = true;
}
</script>

<template>
  <div class="flex flex-col w-full p-4">
    <input
      class="border-4 border-gray-500 bg-gray-400"
      v-model="channelName"
      @keypress.enter="searchChannel(channelName)"
    />
    <EasyDataTable
      v-if="loaded"
      :headers="headers"
      :items="videos"
      rows-per-page="100"
    />
  </div>
</template>
