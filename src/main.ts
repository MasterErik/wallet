import "./mockEnv"; // Импортируем моки перед инициализацией SDK
import { createApp } from "vue";
import { createWebHistory, createRouter } from "vue-router";
import { createPinia } from "pinia";
import WebApp from "@twa-dev/sdk";

import "./style.css";
import App from "./App.vue";

import Auth from "./components/views/Auth.vue";
import Home from "./components/views/Home.vue";
import WalletReceive from "./components/views/WalletReceive.vue";
import WalletSend from "./components/views/WalletSend.vue";

const routes = [
  { path: "/", component: Auth },
  { path: "/home", component: Home },
  { path: "/receive", component: WalletReceive },
  { path: "/send", component: WalletSend },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

WebApp.ready();
WebApp.expand();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#app");
