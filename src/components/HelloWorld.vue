<script setup>
// mucao UCGwXFpbp5uzecUbi3m7aRsw
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre UC50nGMsjEVjeiZAabzcPZ0g

import { ref, computed } from "vue";
import axios from "axios";
import dayjs from "dayjs";

// data
const videos = ref([{}]);
const prop = ref("");
const loaded = ref(false);
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
];
const allPlaylistVideos = [];
const videoPrefix = "https://www.youtube.com/watch?v=";
const channelPrefix = "https://www.youtube.com/channel/";

// computed
const daysProp = computed(() => {
  return prop.value === "days" || prop.value === "sum";
});

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

function sortVideos(a, b) {
  if (Number(a[prop.value]) < Number(b[prop.value])) {
    return daysProp.value ? -1 : 1;
  }
  if (Number(a[prop.value]) > Number(b[prop.value])) {
    return daysProp.value ? 1 : -1;
  }
  return 0;
}

function getDaysToToday(videoDate) {
  const today = dayjs();
  return today.diff(videoDate, "day");
}

async function getVideo(videoId) {
  const videoViewsUrl = `${apiUrl}/videos?part=statistics&id=${videoId}&key=${urlKey}`;
  return await axios.get(videoViewsUrl);
}

async function getVideoViews(videoId) {
  const result = await getVideo(videoId);
  return Number(result.data.items[0].statistics.viewCount);
}

async function getChannelVideos(channelId) {
  const getChannelUrl = `${apiUrl}/channels?part=contentDetails&id=${channelId}&key=${urlKey}`;
  const channel = await axios.get(getChannelUrl);

  const allUploadsPlaylistId =
    channel.data.items[0].contentDetails.relatedPlaylists.uploads;

  return getPlaylistItems(allUploadsPlaylistId);
}

async function doEverything() {
  const channelVideos = await getChannelVideos(channelInfo.value.channelId);
  const temp = {};
  for (const video of channelVideos) {
    const videoContent = video.contentDetails;
    const videoId = videoContent.videoId;
    const views = await getVideoViews(videoContent.videoId);
    const days = getDaysToToday(videoContent.videoPublishedAt);
    const score = Number((views / days).toFixed(2));
    const title = video.snippet.title;
    const url = videoPrefix + videoContent.videoId;
    temp[videoId] = {
      videoId,
      title,
      days,
      views,
      score,
      url,
    };
  }

  const videoArray = Object.keys(temp).map(function (key) {
    return temp[key];
  });

  videos.value = videoArray;
}

async function searchChannel(name) {
  videos.value = [];
  inputSearched.value = name;
  const searchChannelUrl = `${apiUrl}/search?part=snippet&q=${name}&type=channel&key=${urlKey}`;
  const result = await axios.get(searchChannelUrl);
  const channel = result.data.items[0];
  channelInfo.value = channel.snippet;
  await doEverything();
  return result.data.items[0];
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
      rows-per-page="100"
      :loading="inputSearched"
    >
      <template #item-title="{ url, title }"
        ><a :href="url">{{ title }}</a></template
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
