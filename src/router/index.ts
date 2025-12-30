import { createRouter, createWebHistory } from "vue-router";
import DashboardPage from "../pages/Dashboard.vue";
import HomePage from "../pages/Home.vue";
import SimulatePage from "../pages/SimulatePage.vue";
import SettingsPage from "../pages/Settings.vue";
import PortfolioEditor from "../pages/PortfolioEditor.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "home", component: HomePage },
    { path: "/dashboard", name: "dashboard", component: DashboardPage },
    { path: "/simulate/:portfolioId", name: "simulate", component: SimulatePage },
    { path: "/portfolio/new", name: "portfolio-new", component: PortfolioEditor },
    { path: "/portfolio/:id/edit", name: "portfolio-edit", component: PortfolioEditor },
    { path: "/settings", name: "settings", component: SettingsPage },
  ],
});

export default router;
