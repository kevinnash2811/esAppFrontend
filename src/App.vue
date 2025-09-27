<template>
  <div id="app">
    <MainLayout />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSocket } from './composables/useSocket';
import MainLayout from './layout/MainLayout.vue'

const { connect } = useSocket();

onMounted(() => {
  // Conectar automáticamente cuando la app se monta
  connect('http://localhost:3000', {
    auth: {
      username: 'UsuarioApp'
    },
    transports: ['websocket', 'polling']
  });
});
</script>

<style>
#app {
  font-family: 'Roboto', sans-serif;
}
</style>