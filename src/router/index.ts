// import { createRouter, createWebHistory } from 'vue-router'
// import HomeView from '../views/HomeView.vue'

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'home',
//       component: ()=>import('../views/ReqTest.vue'),
//     },
//     {
//       path: '/about',
//       name: 'about',
//       // route level code-splitting
//       // this generates a separate chunk (About.[hash].js) for this route
//       // which is lazy-loaded when the route is visited.
//       component: () => import('../views/AboutView.vue'),
//     },
//   ],
// })

// export default router
import { createRouter, createWebHistory } from 'vue-router'
import TemperatureView from '@/views/TemperatureView.vue'
import CloudDashBoard from '@/views/CloudDashBoard.vue'
import cloud2 from '@/views/cloud2.vue'
import AdvancedAnalyticsDashboard from '@/views/AdvancedAnalyticsDashboard.vue'
import Ad2 from '@/views/Ad2.vue'
import Ad3 from '@/views/Ad3.vue'

const routes = [
  {
    path: '/temperature',
    name: 'Temperature',
    component: TemperatureView
  },
  {
    path: '/cloud2',
    name: 'cloud2',
    component: cloud2
  },
  {
    path: '/clouddashboard',
    name: 'CloudDashBoard',
    component: CloudDashBoard
  },
  {
    path: '/advanced',
    name: 'AdvancedAnalyticsDashboard',
    component: AdvancedAnalyticsDashboard
  },
  {
    path: '/ad2',
    name: 'Ad2',
    component: Ad2
  },
  {
    path: '/ad3',
    name: 'Ad3',
    component: Ad3
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
