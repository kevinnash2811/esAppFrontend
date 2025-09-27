import { createRouter, createWebHistory } from 'vue-router'
import ChatView from '../views/ChatView.vue'
import bankingPage from '../views/bankingPage.vue'
const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'chat',
      component: ChatView
    },
    {
      path: '/banking',
      name: 'Transacciones',
      component: bankingPage
    }
  ]
})

export default router