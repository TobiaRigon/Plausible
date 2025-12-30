import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/Dashboard.vue";
import SimulatePage from "../pages/SimulatePage.vue";
import SettingsPage from "../pages/Settings.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "dashboard", component: DashboardPage },
    { path: "/simulate/:bucketId", name: "simulate", component: SimulatePage },
    { path: "/settings", name: "settings", component: SettingsPage },
  ],
});

export default router;
