// FILE: main.js

import { createApp } from 'vue'
import { Notify, Quasar, Dark } from 'quasar'
import quasarLang from 'quasar/lang/es'
import quasarIconSet from 'quasar/icon-set/material-icons'
// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Assumes your root component is App.vue
// and placed in same folder as main.js
import App from './App.vue'
import router from './router'
import { useThemeStore } from './store/theme-store';
import { createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { socketService } from './services/socket.service'

// Importar mensajes de idioma
import enUS from './locales/en.json'
import esES from './locales/es.json'

// Configurar i18n
const i18n = createI18n({
  locale: 'es', // Idioma por defecto
  fallbackLocale: 'en',
  messages: {
    en: enUS,
    es: esES,
  },
  legacy: false, // Para Composition API
})
const pinia = createPinia()
const app = createApp(App)
// Usar Quasar
app.use(Quasar, {
  plugins: {
    Notify,
    Dark
  },
  lang: quasarLang,
  iconSet: quasarIconSet,
  // config: {
  //   dark: 'auto' // Configuración inicial
  // }
})

// Hacer socketService disponible globalmente
app.config.globalProperties.$socket = socketService
app.use(pinia)
app.use(router)
app.use(i18n)

// Inicializar el tema antes de montar la app
const themeStore = useThemeStore();
themeStore.initializeTheme();
// Assumes you have a <div id="app"></div> in your index.html
app.mount('#app')
