<script setup>
// mucao UCGwXFpbp5uzecUbi3m7aRsw
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre UC50nGMsjEVjeiZAabzcPZ0g

import { ref, computed } from "vue";
import axios from "axios";
import dayjs from "dayjs";

// data
const videos = ref({});
const prop = ref("");
const lists = ref({
  byScore: { title: "Pontuação", data: [], labels: [] },
  byDays: { title: "Mais recente", data: [], labels: [] },
  byViews: { title: "Visualizações", data: [], labels: [] },
});
const loaded = ref(false);
const channelName = ref("");
const channelInfo = ref(null);

const apiUrl = "https://www.googleapis.com/youtube/v3";
const urlKey = "AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0";
const headers = [
  { text: "Título", value: "title", sortable: true },
  { text: "Idade", value: "days", sortable: true },
  { text: "Ranking idade", value: "daysRanking", sortable: true },
  { text: "Pontuação", value: "score", sortable: true },
  { text: "Ranking Pontuação", value: "scoreRanking", sortable: true },
  { text: "Visualizações", value: "views", sortable: true },
  { text: "Ranking Visualizações", value: "viewsRanking", sortable: true },
  { text: "Soma dos rankings", value: "sum", sortable: true },
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
  return result.data.items[0].statistics.viewCount;
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
    const score = Number((Number(views) / days).toFixed(2));
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
    ``;
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

async function searchChannel(name) {
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
      v-if="loaded"
      :headers="headers"
      :items="videos"
      rows-per-page="100"
    >
      <template #item-title="{ url, title }"
        ><a :href="url">{{ url }}</a></template
      >
    </EasyDataTable>
  </div>
</template>
