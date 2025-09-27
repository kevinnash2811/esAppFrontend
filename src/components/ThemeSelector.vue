<template>
  <q-btn flat round dense :icon="themeIcon" class="q-mr-sm">
    <q-tooltip>Cambiar tema ({{ currentTheme }})</q-tooltip>
    
    <q-menu anchor="bottom end" self="top end">
      <q-list style="min-width: 180px">
        <q-item-label header>Tema</q-item-label>
        
        <q-item 
          clickable 
          v-close-popup
          :active="currentTheme === 'light'"
          @click="applyTheme('light')"
          class="theme-option"
        >
          <q-item-section avatar>
            <q-icon name="light_mode" :color="currentTheme === 'light' ? 'primary' : 'grey'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Claro</q-item-label>
          </q-item-section>
          <q-item-section avatar v-if="currentTheme === 'light'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        
        <q-item 
          clickable 
          v-close-popup
          :active="currentTheme === 'dark'"
          @click="applyTheme('dark')"
          class="theme-option"
        >
          <q-item-section avatar>
            <q-icon name="dark_mode" :color="currentTheme === 'dark' ? 'primary' : 'grey'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Oscuro</q-item-label>
          </q-item-section>
          <q-item-section avatar v-if="currentTheme === 'dark'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        
        <q-item 
          clickable 
          v-close-popup
          :active="currentTheme === 'auto'"
          @click="applyTheme('auto')"
          class="theme-option"
        >
          <q-item-section avatar>
            <q-icon name="brightness_auto" :color="currentTheme === 'auto' ? 'primary' : 'grey'" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Automático</q-item-label>
            <q-item-label caption>Sistema</q-item-label>
          </q-item-section>
          <q-item-section avatar v-if="currentTheme === 'auto'">
            <q-icon name="check" color="primary" />
          </q-item-section>
        </q-item>
        
        <q-separator />
        
        <q-item clickable v-close-popup @click="toggleTheme">
          <q-item-section avatar>
            <q-icon name="swap_horiz" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Alternar tema</q-item-label>
            <q-item-label caption>Cambio rápido</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useThemeStore } from '../store/theme-store';

const themeStore = useThemeStore();

const currentTheme = computed(() => themeStore.currentTheme);

const themeIcon = computed(() => {
  switch (currentTheme.value) {
    case 'dark': return 'dark_mode';
    case 'light': return 'light_mode';
    case 'auto': return 'brightness_auto';
    default: return 'brightness_auto';
  }
});

const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  themeStore.applyTheme(theme);
};

const toggleTheme = () => {
  themeStore.toggleTheme();
};
</script>

<style scoped>
.theme-option:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.body--dark .theme-option:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
</style>