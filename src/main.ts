import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import "./index.css";
import Vue3EasyDataTable from 'vue3-easy-data-table';
import 'vue3-easy-data-table/dist/style.css';


const app = createApp(App);
app.component('EasyDataTable', Vue3EasyDataTable);

app.use(router);

app.mount("#app");
