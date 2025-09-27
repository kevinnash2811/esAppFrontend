<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">{{ $t('banking.title') }}</div>
    
    <div class="row q-col-gutter-md">
      <!-- Panel izquierdo: Simulador y Historial -->
      <div class="col-12 col-md-6">
        <transaction-simulator class="q-mb-md" />
        <transaction-history />
      </div>
      
      <!-- Panel derecho: Dashboard -->
      <div class="col-12 col-md-6">
        <banking-dashboard />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'
import TransactionSimulator from '../modules/banking/components/TransactionSimulator.vue'
import TransactionHistory from '../modules/banking/components/TransactionHistory.vue'
import BankingDashboard from '../modules/banking/components/BankingDashboard.vue'
const instance = getCurrentInstance()
const { $t } = instance?.appContext.config.globalProperties || {}
</script>