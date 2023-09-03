import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import favoritePage from '../components/favoritePage.vue'
import homePage from '../components/homePage.vue'
import playerPage from '../components/playerPage.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    // {
    //   path:'/home',
    //   component:homePage,
    // },
    // {
    //   path:'/player',
    //   component: playerPage
    // },
    // {
    //   path: '/favorite',
    //   name: 'favorite',
    //   component:favoritePage
    // }
  ]
})

export default router
