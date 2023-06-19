<script setup>
// mucao UCGwXFpbp5uzecUbi3m7aRsw
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre ''''UC50nGMsjEVjeiZAabzcPZ0g''''
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
const urlKey = "AIzaSyBy5PsZmq3zn2jSdnrn1bGT9lsF-6NwVx4";
const headers = [
  { text: "Título", value: "title", sortable: true },
  { text: "Idade (dias)", value: "days", sortable: true },
  { text: "Pontuação", value: "score", sortable: true },
  { text: "Visualizações", value: "views", sortable: true },
  { text: "Likes", value: "likes", sortable: true },
  { text: "Comentários", value: "comments", sortable: true },
];
const videoPrefix = "https://www.youtube.com/watch?v=";
const channelPrefix = "https://www.youtube.com/channel/";
let allPlaylistVideos = [];
const logoSrc = computed(() => {
  return !!videos.value.length ? "img/youtube_short.svg" : "img/youtube.svg";
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

function getScore(views, days, comments, likes) {
  return Number((views * 4) / ((days + 1) * 5) + comments * 2 + likes * 3);
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
    const days = getDaysToToday(videoContent.videoPublishedAt);
    const score = getScore(views, days, comments, likes);
    const title = video.snippet.title;
    const url = videoPrefix + videoContent.videoId;
    const thumbnail = video.snippet.thumbnails.default.url;
    const description = video.snippet.description;
    videos.value.push({
      videoId,
      title,
      days,
      views,
      likes,
      comments,
      score,
      url,
      thumbnail,
      description,
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
  <div class="search" :class="{ activeSearch: !!videos.length }">
    <span class="search__header">
      <img class="search__header__logo" :src="logoSrc" />
      <input
        class="search__header__input"
        placeholder="Search for a youtube channel"
        v-model="channelName"
        @keypress.enter="searchChannel(channelName)"
      />
    </span>
    <span class="search__content">
      <a
        class="search__content__title"
        v-if="channelInfo"
        :href="`${channelPrefix}${channelInfo.channelId}`"
      >
        <img
          class="search__content__title__img"
          :src="channelInfo.thumbnails.default.url"
        />
        <span class="search__content__title__info">{{
          channelInfo.channelTitle
        }}</span>
      </a>
      <EasyDataTable
        :headers="headers"
        :items="videos"
        :rows-per-page="100"
        :loading="loading"
        v-if="videos.length"
      >
        <template #item-title="{ url, title, thumbnail }">
          <span class="search__content__table__title">
            <img class="search__content__table__title__img" :src="thumbnail" />
            <a :href="url" target="_blank">{{ title }}</a>
          </span></template
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
    </span>
  </div>
</template>

<style lang="scss" scoped>
.search {
  @apply flex h-full w-full flex-col items-center justify-center p-4;
  &__header {
    @apply flex w-full flex-col justify-center items-center;
    &__logo {
      @apply mb-6 w-full max-w-md justify-center;
    }
    &__input {
      @apply h-10 w-full max-w-md rounded-lg border-2 border-gray-500 bg-gray-200 px-2;
    }
  }
  &__content {
    @apply mb-6 mt-2 overflow-auto w-full;
    max-height: 90%;
    &__table {
      &__title {
        @apply flex p-2 gap-2;
        &__img {
          @apply hidden md:flex;
        }
      }
    }
    &__title {
      @apply flex mb-2;
      &__img {
        @apply mr-2 rounded-lg;
      }
    }
  }
}
.activeSearch {
  @apply w-full;
  & .search__header {
    @apply w-full flex-row items-center gap-x-2;
    &__logo {
      @apply m-0 w-12;
    }
    &__input {
      @apply w-full max-w-none;
    }
  }
}
</style>
