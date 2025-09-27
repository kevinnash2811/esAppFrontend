<template>
  <q-select
    v-model="locale"
    :options="languageOptions"
    option-label="label"
    option-value="value"
    emit-value
    map-options
    dense
    borderless
    style="min-width: 120px;"
    class="q-ml-md"
  >
    <template v-slot:prepend>
      <q-icon name="translate" />
    </template>
    
    <template v-slot:option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="scope.opt.flag" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.label }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { watch } from 'vue';

const { locale } = useI18n();

const languageOptions = [
  {
    value: 'es',
    label: 'Español',
    flag: 'img:https://flagcdn.com/w20/es.png'
  },
  {
    value: 'en', 
    label: 'English',
    flag: 'img:https://flagcdn.com/w20/us.png'
  }
];

// Opcional: Guardar preferencia en localStorage
watch(locale, (newLocale) => {
  localStorage.setItem('preferred-language', newLocale);
});

// Opcional: Cargar preferencia al iniciar
const savedLocale = localStorage.getItem('preferred-language');
if (savedLocale) {
  locale.value = savedLocale;
}
</script>