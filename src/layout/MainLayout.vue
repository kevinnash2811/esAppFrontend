<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8" height-hint="64">
      <q-toolbar class="GNL__toolbar">
        <!-- Botón menú - siempre visible en móvil -->
        <q-btn
          flat
          dense
          round
          @click="toggleLeftDrawer"
          :aria-label="t('layout.menu.ariaLabel')"
          icon="menu"
          class="q-mr-sm"
        />
        
        <!-- Logo y título - se adapta a diferentes tamaños -->
        <q-toolbar-title shrink class="row items-center no-wrap">
          <img src="../assets/logo.jpg" alt="Logo" class="logo-image">
          <span class="q-ml-sm" :class="{ 'hidden': screen.lt.md }">{{ t('layout.title') }}</span>
        </q-toolbar-title>

        <q-space />

        <!-- Barra de búsqueda - se adapta/oculta en móvil -->
        <q-input 
          v-if="screen.gt.xs" 
          class="GNL__toolbar-input" 
          :class="{ 'GNL__toolbar-input--compact': screen.lt.md }"
          outlined 
          dense 
          v-model="search" 
          color="bg-grey-7 shadow-1" 
          :placeholder="t('layout.search.placeholder')"
        >
          <template v-slot:prepend>
            <q-icon v-if="search === ''" name="search" />
            <q-icon v-else name="clear" class="cursor-pointer" @click="search = ''" />
          </template>
        </q-input>

        <q-space v-if="screen.gt.xs" />

        <!-- Iconos de acción - se reorganizan en móvil -->
        <div class="q-gutter-sm row items-center no-wrap">
          <!-- Selector de idioma siempre visible -->
          <language-selector />
          
          <!-- Botones que se ocultan en móvil -->
          <q-btn v-if="screen.gt.sm" round dense flat color="text-grey-7" icon="apps">
            <q-tooltip>{{ t('layout.tooltips.apps') }}</q-tooltip>
          </q-btn>
          
          <!-- Notificaciones - badge responsivo -->
          <q-btn round dense flat color="grey-8" icon="notifications">
            <q-badge color="red" text-color="white" floating class="badge-sm">
              {{ notificationsCount }}
            </q-badge>
            <q-tooltip>{{ t('layout.tooltips.notifications') }}</q-tooltip>
          </q-btn>
          
          <!-- Perfil de usuario -->
          <q-btn round flat class="user-avatar">
            <q-avatar size="32px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png" :alt="t('layout.user.avatarAlt')">
            </q-avatar>
            <q-menu anchor="bottom end" self="top end">
              <q-list style="min-width: 150px">
                <q-item clickable v-close-popup>
                  <q-item-section>{{ t('layout.user.profile') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section>{{ t('layout.user.settings') }}</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup>
                  <q-item-section>{{ t('layout.user.logout') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
          
          <!-- Menú móvil alternativo -->
          <q-btn v-if="screen.lt.sm" flat dense round icon="more_vert">
            <q-menu anchor="top end" self="top start">
              <q-list dense style="min-width: 150px">
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="apps" />
                  </q-item-section>
                  <q-item-section>{{ t('layout.tooltips.apps') }}</q-item-section>
                </q-item>
                <q-item clickable v-close-popup>
                  <q-item-section avatar>
                    <q-icon name="settings" />
                  </q-item-section>
                  <q-item-section>{{ t('layout.user.settings') }}</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <!-- Drawer responsivo -->
    <q-drawer
      v-model="leftDrawerOpen"
      :breakpoint="768"
      show-if-above
      bordered
      class="bg-white"
      :width="280"
    >
      <q-scroll-area class="fit">
        <q-list padding class="text-grey-8">
          <!-- Encabezado del drawer -->
          <q-item class="bg-grey-2">
            <q-item-section avatar>
              <q-avatar size="40px">
                <img src="https://cdn.quasar.dev/img/boy-avatar.png" :alt="t('layout.user.avatarAlt')">
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ t('layout.user.currentUser') }}</q-item-label>
              <q-item-label caption>admin@sistema.com</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Navegación principal -->
          <q-item-label header class="text-weight-bold">{{ t('layout.navigation.title') }}</q-item-label>
          
          <q-item 
            class="GNL__drawer-item" 
            v-ripple 
            clickable
            :active="isRouteActive('home')"
            @click="navigateTo('/')"
            active-class="active-menu-item"
          >
            <q-item-section avatar>
              <q-icon name="home" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.navigation.dashboard') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item 
            class="GNL__drawer-item" 
            v-ripple 
            clickable
            :active="isRouteActive('banking')"
            @click="navigateTo('/banking')"
            active-class="active-menu-item"
          >
            <q-item-section avatar>
              <q-icon name="account_balance" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.navigation.transactions') }}</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge v-if="pendingTransactions > 0" color="red" rounded>{{ pendingTransactions }}</q-badge>
            </q-item-section>
          </q-item>

          <q-item 
            class="GNL__drawer-item" 
            v-ripple 
            clickable
            :active="isRouteActive('reports')"
            @click="navigateTo('/reports')"
            active-class="active-menu-item"
          >
            <q-item-section avatar>
              <q-icon name="analytics" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.navigation.reports') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Menú rápido -->
          <q-item-label header class="text-weight-bold">{{ t('layout.quickActions.title') }}</q-item-label>
          
          <q-item class="GNL__drawer-item" v-ripple clickable @click="quickAction('new_transaction')">
            <q-item-section avatar>
              <q-icon name="send" color="primary" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.quickActions.newTransaction') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item class="GNL__drawer-item" v-ripple clickable @click="quickAction('view_reports')">
            <q-item-section avatar>
              <q-icon name="receipt" color="green" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.quickActions.viewStatement') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <!-- Enlaces de soporte -->
          <q-item-label header class="text-weight-bold">{{ t('layout.support.title') }}</q-item-label>
          
          <q-item class="GNL__drawer-item" v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="help" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.support.helpCenter') }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-item class="GNL__drawer-item" v-ripple clickable>
            <q-item-section avatar>
              <q-icon name="contact_support" />
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ t('layout.support.contactSupport') }}</q-item-label>
            </q-item-section>
          </q-item>

          <!-- Información del sistema -->
          <div class="absolute-bottom q-pa-md text-caption text-grey-6">
            <div>{{ t('layout.footer.version') }}</div>
            <div>{{ t('layout.footer.copyright') }}</div>
          </div>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Contenido principal con padding responsivo -->
    <q-page-container class="page-container">
      <router-view />
    </q-page-container>

    <!-- Botón flotante para móvil -->
    <q-page-sticky v-if="screen.lt.md" position="bottom-right" :offset="[18, 18]">
      <q-btn 
        fab 
        icon="add" 
        color="primary" 
        @click="quickAction('new_transaction')"
        class="floating-action-btn"
      >
        <q-tooltip>{{ t('layout.quickActions.newTransaction') }}</q-tooltip>
      </q-btn>
    </q-page-sticky>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import LanguageSelector from '../components/LanguageSelector.vue'

const { t } = useI18n()
const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const leftDrawerOpen = ref(false)
const search = ref('')
const notificationsCount = ref(3)
const pendingTransactions = ref(2)

const screen = $q.screen

// Computed para estado de rutas
const isRouteActive = (routeName: string) => {
  return route.name === routeName
}

// Métodos de navegación
const navigateTo = (path: string) => {
  router.push(path)
  // Cerrar drawer automáticamente en móvil
  if (screen.lt.md) {
    leftDrawerOpen.value = false
  }
}

const quickAction = (action: string) => {
  switch(action) {
    case 'new_transaction':
      router.push('/banking')
      break
    case 'view_reports':
      router.push('/reports')
      break
  }
  leftDrawerOpen.value = false
}

const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style scoped>
.logo-image {
  height: 32px;
  width: auto;
}

.hidden {
  display: none;
}

.badge-sm {
  font-size: 10px;
  padding: 2px 4px;
  min-width: 16px;
  height: 16px;
}

.user-avatar {
  margin-left: 8px;
}

.floating-action-btn {
  z-index: 2000;
}
</style>

<style lang="sass">
.GNL
  &__toolbar
    height: 64px
    padding: 0 16px

    @media (max-width: 600px)
      padding: 0 8px
      height: 56px

  &__toolbar-input
    width: 45%
    max-width: 600px
    transition: all 0.3s ease

    &--compact
      width: 200px

    @media (max-width: 1024px)
      width: 35%

    @media (max-width: 768px)
      width: 200px

  &__drawer-item
    line-height: 24px
    border-radius: 0 24px 24px 0
    margin-right: 12px
    transition: all 0.2s ease

    .q-item__section--avatar
      .q-icon
        color: #5f6368

    .q-item__label
      color: #3c4043
      letter-spacing: .01785714em
      font-size: .875rem
      font-weight: 500
      line-height: 1.25rem

    &:hover
      background-color: #f1f3f4

  .active-menu-item
    background-color: #e8f0fe
    color: #1a73e8
    font-weight: 600

    .q-icon
      color: #1a73e8 !important

.page-container
  padding: 20px

  @media (max-width: 1024px)
    padding: 16px

  @media (max-width: 768px)
    padding: 12px

  @media (max-width: 480px)
    padding: 8px

// Mejoras para móvil
@media (max-width: 768px)
  .q-header .q-toolbar__title span
    font-size: 1.1rem

  .q-drawer
    .q-item
      padding: 8px 16px

    .q-item__label
      font-size: 0.9rem

// Animaciones suaves
.q-drawer
  transition: transform 0.3s ease

.q-page-sticky
  transition: all 0.3s ease

// Mejoras de accesibilidad
.q-focusable:focus
  outline: 2px solid #1a73e8
  outline-offset: 2px

// Estados hover mejorados
.q-btn:hover
  transform: translateY(-1px)
  transition: transform 0.2s ease

// Scroll personalizado
.q-scrollarea__thumb
  background-color: rgba(0, 0, 0, 0.2)
  border-radius: 4px

  &:hover
    background-color: rgba(0, 0, 0, 0.4)
</style>