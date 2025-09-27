import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Dark } from 'quasar';

export type ThemeMode = 'light' | 'dark' | 'auto';

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeMode>(loadThemePreference());
  const isDark = ref(Dark.isActive);

  // Cargar preferencia del tema desde localStorage
  function loadThemePreference(): ThemeMode {
    const saved = localStorage.getItem('theme-preference') as ThemeMode;
    return saved || 'light';
  }

  // Aplicar el tema
  function applyTheme(theme: ThemeMode) {
    currentTheme.value = theme;
    
    switch (theme) {
      case 'dark':
        Dark.set(true);
        document.documentElement.setAttribute('data-theme', 'dark');
        break;
      case 'light':
        Dark.set(false);
        document.documentElement.setAttribute('data-theme', 'light');
        break;
      case 'auto':
        // Usar la preferencia del sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        Dark.set(systemPrefersDark);
        document.documentElement.setAttribute('data-theme', systemPrefersDark ? 'dark' : 'light');
        break;
    }
    
    // Guardar preferencia
    localStorage.setItem('theme-preference', theme);
    isDark.value = Dark.isActive;
  }

  // Alternar entre claro/oscuro
  function toggleTheme() {
    const newTheme = isDark.value ? 'light' : 'dark';
    applyTheme(newTheme);
  }

  // Inicializar el tema al cargar la aplicación
  function initializeTheme() {
    applyTheme(currentTheme.value);
    
    // Escuchar cambios en la preferencia del sistema (solo para modo auto)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (currentTheme.value === 'auto') {
        Dark.set(e.matches);
        isDark.value = e.matches;
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    });
  }

  return {
    currentTheme,
    isDark,
    applyTheme,
    toggleTheme,
    initializeTheme
  };
});