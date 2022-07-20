<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import axios from "axios";
import _, { map } from "underscore";
import * as dayjs from "dayjs";

const data: any = ref([]);
const labels: any = ref([]);
const videos: any = ref([]);
const prop: any = ref("");
const lists: any = ref({});

const daysProp = computed(() => {
  return prop.value === "days";
});
// pililiu UCInnYQKgaud_jbIWV71YF-w
// andre UC50nGMsjEVjeiZAabzcPZ0g
onMounted(async () => {
  const channel = await axios.get(
    "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=UC50nGMsjEVjeiZAabzcPZ0g&key=AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0"
  );
  const playlistId =
    channel.data.items[0].contentDetails.relatedPlaylists.uploads;

  const videoResults = await getPlaylistItems(playlistId);

  for (const item of videoResults) {
    const views = await getVideoViews(item.contentDetails.videoId);
    const days = getDaysToToday(item.contentDetails.videoPublishedAt);
    const score = Number((Number(views) / days).toFixed(2));
    await videos.value.push({
      videoId: item.contentDetails.videoId,
      title: item.snippet.title,
      days,
      views,
      score,
    });
  }
  prop.value = "score";
  lists.value.byScore = { data: [], labels: [] };
  const copyScore = [].concat(videos.value.sort(sortVideos));
  lists.value.byScore.title = "By Score";
  lists.value.byScore.prop = prop.value;
  lists.value.byScore.data = copyScore;
  lists.value.byScore.data.length = 10;

  prop.value = "days";
  lists.value.byDays = { data: [], labels: [] };
  const copyDays = [].concat(videos.value.sort(sortVideos));
  lists.value.byDays.title = "By Days";
  lists.value.byDays.prop = prop.value;
  lists.value.byDays.data = copyDays;
  lists.value.byDays.data.length = 10;

  prop.value = "views";
  lists.value.byViews = { data: [], labels: [] };
  const copyViews = [].concat(videos.value.sort(sortVideos));
  lists.value.byViews.title = "By Views";
  lists.value.byViews.prop = prop.value;
  lists.value.byViews.data = copyViews;
  lists.value.byViews.data.length = 10;

  console.log(lists.value);
  // data.value = videos.value.map((video: any) =>
  //   Number(video.score).toLocaleString("pt-BR")
  // );
  // videos.value.length = 10;
});
let videoResults: any = [];

async function getPlaylistItems(playlistId: string, pageToken = "") {
  const playlistItems = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet%2CcontentDetails&maxResults=50&playlistId=${playlistId}&key=AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0`;
  const result = await axios.get(`${playlistItems}&pageToken=${pageToken}`);
  pageToken = result.data.nextPageToken;
  videoResults.push(...result.data.items);

  if (pageToken) {
    await getPlaylistItems(playlistId, pageToken);
  }
  return videoResults;
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
  const result = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=AIzaSyACUShvB-Weq0VkbJ6Yc-ah4NMaoo54rs0`
  );
  return result.data.items[0].statistics.viewCount;
}
</script>

<template>
  <div v-if="videos" :class="$style['greetings']">
    <div v-for="(list, index) of lists">
      {{ list.title }}
      <div v-for="(video, index) of list.data" class="item">
        <div class="title">{{ video.title }}</div>
        <div class="score">
          {{
            Number(video[list.prop]).toLocaleString("pt-BR", {
              minimumFractionDigits: list.prop === "score" ? 2 : 0,
            })
          }}
        </div>
      </div>
    </div>
    <!-- <Bar
      v-if="labels && labels.length"
      :chart-data="{ labels: labels, datasets: [{ data }] }"
      chart-id="bar-chart"
      dataset-id-key="label"
      :width="1000"
      :height="1000"
    /> -->
  </div>
</template>

<style lang="scss" module>
.greetings {
  @apply bg-gray-900 text-blue-500;

  width: 100%;
  display: flex;
}
.item {
  display: flex;
  text-align: left;
  width: 100%;
}
.title {
  @apply bg-gray-900 text-blue-500;

  display: flex;

  padding: 8px;
  width: 60%;
  align-items: center;

  border-radius: 12px;
  margin-bottom: 4px;
  margin-right: 10px;
}

.score {
  font-size: 20px;
  font-weight: bold;
}
</style>
