<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ t('banking.history.title') }}</div>
    </q-card-section>

    <q-card-section>
      <!-- Filtros -->
      <div class="row q-gutter-md q-mb-md">
        <q-select
          v-model="filters.accountId"
          :options="filterAccountOptions"
          option-label="holderName"
          option-value="id"
          emit-value
          map-options
          clearable
          :label="t('banking.history.filterByAccount')"
          style="min-width: 200px;"
        />
        
        <q-input
          v-model.number="filters.minAmount"
          type="number"
          :label="t('banking.history.minAmount')"
          prefix="$"
          style="min-width: 150px;"
        />
        
        <q-input
          v-model.number="filters.maxAmount"
          type="number"
          :label="t('banking.history.maxAmount')"
          prefix="$"
          style="min-width: 150px;"
        />
        
        <q-btn 
          color="secondary" 
          icon="filter_alt" 
          :label="t('banking.history.filter')"
          @click="applyFilters"
        />
        
        <q-btn 
          color="grey" 
          icon="clear" 
          :label="t('banking.history.clear')"
          @click="clearFilters"
        />
      </div>

      <!-- Lista de transacciones -->
      <div v-if="filteredTransactions.length === 0" class="text-center q-pa-lg text-grey">
        <q-icon name="receipt_long" size="xl" class="q-mb-sm" />
        <div>{{ t('banking.history.noTransactions') }}</div>
      </div>

      <div v-else class="transaction-list">
        <q-list separator>
          <q-item 
            v-for="transaction in filteredTransactions" 
            :key="transaction.id"
            class="q-mb-sm"
          >
            <q-item-section avatar>
              <q-avatar :color="getTransactionColor(transaction)" text-color="white">
                <q-icon name="account_balance" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-bold">
                {{ getAccountName(transaction.fromAccountId) }} → 
                {{ getAccountName(transaction.toAccountId) }}
              </q-item-label>
              <q-item-label caption>
                {{ formatDate(transaction.timestamp) }}
                <span v-if="transaction.description">• {{ transaction.description }}</span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-item-label class="text-weight-bold text-negative">
                -{{ formatCurrency(transaction.amount) }}
              </q-item-label>
              <q-item-label caption>
                {{ getStatusText(transaction.status) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>

        <!-- Resumen -->
        <q-card flat class="bg-grey-2 q-mt-md">
          <q-card-section>
            <div class="row items-center">
              <div class="col">
                <div class="text-caption">{{ t('banking.history.filteredTotal') }}:</div>
                <div class="text-h6">{{ formatCurrency(filteredTotal) }}</div>
              </div>
              <div class="col">
                <div class="text-caption">{{ t('banking.history.transactions') }}:</div>
                <div class="text-h6">{{ filteredTransactions.length }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBankingStore } from '../stores/banking-store';
import type { Transaction } from '../types/banking';

const { t } = useI18n();
const bankingStore = useBankingStore();

// Filtros
const filters = ref({
  accountId: '',
  minAmount: undefined as number | undefined,
  maxAmount: undefined as number | undefined
});

// Transacciones filtradas
const filteredTransactions = computed(() => {
  const today = new Date();
  
  return bankingStore.transactions.filter(t => {
    // Filtrar por fecha (solo hoy)
    const isToday = new Date(t.timestamp).toDateString() === today.toDateString();
    if (!isToday) return false;
    
    // Filtrar por cuenta
    const matchesAccount = !filters.value.accountId || 
      t.fromAccountId === filters.value.accountId || 
      t.toAccountId === filters.value.accountId;
    
    // Filtrar por monto
    const matchesMinAmount = !filters.value.minAmount || t.amount >= filters.value.minAmount;
    const matchesMaxAmount = !filters.value.maxAmount || t.amount <= filters.value.maxAmount;
    
    return matchesAccount && matchesMinAmount && matchesMaxAmount;
  });
});

// Opciones para filtro de cuentas
const filterAccountOptions = computed(() => [
  { id: '', holderName: t('banking.history.allAccounts') },
  ...bankingStore.accounts
]);

// Total de transacciones filtradas
const filteredTotal = computed(() => 
  filteredTransactions.value.reduce((sum, t) => sum + t.amount, 0)
);

// Métodos
const getAccountName = (accountId: string) => {
  const account = bankingStore.getAccountById(accountId);
  return account ? account.holderName : t('banking.history.accountNotFound');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const formatDate = (timestamp: Date) => {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getTransactionColor = (transaction: Transaction) => {
  switch (transaction.status) {
    case 'completed': return 'positive';
    case 'failed': return 'negative';
    case 'pending': return 'warning';
    default: return 'grey';
  }
};

const getStatusText = (status: string) => {
  const statusMap: { [key: string]: string } = {
    'completed': t('banking.history.statusCompleted'),
    'failed': t('banking.history.statusFailed'),
    'pending': t('banking.history.statusPending')
  };
  return statusMap[status] || status;
};

const applyFilters = () => {
  // Los filtros se aplican automáticamente mediante computed
  console.log('Filtros aplicados:', filters.value);
};

const clearFilters = () => {
  filters.value = {
    accountId: '',
    minAmount: undefined,
    maxAmount: undefined
  };
};

onMounted(() => {
  // Cargar algunas transacciones de ejemplo al montar
  if (bankingStore.transactions.length === 0) {
    loadSampleTransactions();
  }
});

const loadSampleTransactions = () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'txn_1',
      fromAccountId: 'acc_001',
      toAccountId: 'acc_002',
      amount: 1000,
      currency: 'USD',
      timestamp: new Date(),
      status: 'completed',
      description: t('banking.history.sampleTransfer')
    },
    {
      id: 'txn_2',
      fromAccountId: 'acc_003',
      toAccountId: 'acc_001',
      amount: 5000,
      currency: 'USD',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
      status: 'completed',
      description: t('banking.history.samplePayment')
    }
  ];

  bankingStore.transactions.push(...sampleTransactions);
};
</script>

<style scoped>
.transaction-list {
  max-height: 400px;
  overflow-y: auto;
}

.q-item {
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.q-item:hover {
  background-color: #f5f5f5;
}
</style>