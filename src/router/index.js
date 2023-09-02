import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import favoritePage from '../components/favoritePage.vue'
import homePage from '../components/homePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect:'/home'
    },
    {
      path:'/home',
      component:homePage,
    },
    {
      path: '/favorite',
      name: 'favorite',
      component:favoritePage
    }
  ]
})

export default router
