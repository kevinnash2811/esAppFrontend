<template>
  <div class="dashboard-container">
    <!-- Indicador de conexión WebSocket -->
    <div class="row q-mb-md">
      <div class="col-12">
        <q-badge 
          :color="websocketService.isConnected.value ? 'green' : 'orange'" 
          class="connection-badge"
        >
          <q-icon 
            :name="websocketService.isConnected.value ? 'wifi' : 'sync'" 
            class="q-mr-xs"
          />
          {{ websocketService.isConnected.value ? 
            t('banking.dashboard.connected') : 
            t('banking.dashboard.connecting') }}
          <q-tooltip>
            {{ websocketService.isConnected.value ? 
              t('banking.dashboard.realTimeData') : 
              t('banking.dashboard.usingMockData') }}
          </q-tooltip>
        </q-badge>
        
        <span class="text-caption text-grey-7 q-ml-sm">
          {{ t('banking.dashboard.lastUpdate') }}: {{ formattedLastUpdate }}
        </span>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div 
        class="col-12 col-sm-6 col-md-3" 
        v-for="(stat, index) in statsCards" 
        :key="stat.title"
      >
        <q-card 
          class="stat-card improved-stat-card" 
          :class="`stat-card-${index} ${stat.trend >= 0 ? 'positive-trend' : 'negative-trend'}`"
          flat
          bordered
          @click="handleStatClick(stat)"
        >
          <q-card-section class="q-pa-md">
            <div class="row items-center no-wrap">
              <div class="col">
                <!-- Header con icono y título -->
                <div class="row items-center q-mb-sm">
                  <q-icon 
                    :name="stat.icon" 
                    :color="stat.color || getDefaultColor(index)"
                    size="sm"
                    class="q-mr-xs"
                  />
                  <div class="text-caption text-grey-7 text-weight-medium">
                    {{ stat.title }}
                  </div>
                </div>
                
                <!-- Valor principal -->
                <div class="text-h5 text-weight-bold q-mt-xs stat-value">
                  {{ stat.value }}
                </div>
                
                <!-- Trend indicator -->
                <div v-if="stat.trend !== undefined" class="row items-center q-mt-xs">
                  <q-icon 
                    :name="stat.trend >= 0 ? 'arrow_upward' : 'arrow_downward'" 
                    :color="stat.trend >= 0 ? 'positive' : 'negative'"
                    size="xs"
                  />
                  <span 
                    class="text-caption q-ml-xs"
                    :class="stat.trend >= 0 ? 'text-positive' : 'text-negative'"
                  >
                    {{ stat.trend >= 0 ? '+' : '' }}{{ stat.trend }}%
                  </span>
                  <span class="text-caption text-grey-7 q-ml-xs">
                    vs ayer
                  </span>
                </div>
                
                <!-- Subtítulo o descripción -->
                <div v-if="stat.subtitle" class="text-caption text-grey-7 q-mt-xs">
                  {{ stat.subtitle }}
                </div>
              </div>
              
              <!-- Indicador visual derecho -->
              <div class="col-auto">
                <q-circular-progress
                  v-if="stat.percentage !== undefined"
                  :value="stat.percentage"
                  size="40px"
                  :thickness="0.2"
                  :color="getProgressColor(stat.percentage)"
                  track-color="grey-3"
                  class="q-ml-sm"
                >
                  <span class="text-caption">{{ stat.percentage }}%</span>
                </q-circular-progress>
                <q-icon
                  v-else
                  :name="getStatIcon(index)"
                  :color="getDefaultColor(index)"
                  size="md"
                  class="q-ml-sm"
                />
              </div>
            </div>
            
            <!-- Loading state -->
            <q-inner-loading 
              :showing="stat.loading" 
              :color="getDefaultColor(index)"
            >
              <q-spinner-tail size="30px" />
            </q-inner-loading>
          </q-card-section>
          
          <!-- Tooltip informativo -->
          <q-tooltip v-if="stat.tooltip">
            {{ stat.tooltip }}
          </q-tooltip>
        </q-card>
      </div>
    </div>

    <!-- Mercado Cripto en Tiempo Real -->
    <q-card class="crypto-card" flat bordered>
      <q-card-section class="q-pa-md">
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6 text-weight-bold">{{ t('banking.dashboard.cryptoMarket') }}</div>
          <div class="row items-center q-gutter-sm">
            <q-btn 
              round 
              dense 
              flat 
              icon="refresh" 
              @click="manualRefresh"
              :loading="refreshing"
            >
              <q-tooltip>{{ t('banking.dashboard.refresh') }}</q-tooltip>
            </q-btn>
            <q-select
              v-model="selectedInterval"
              :options="intervalOptions"
              dense
              borderless
              emit-value
              map-options
              style="min-width: 120px;"
              :label="t('banking.dashboard.updateInterval')"
            />
          </div>
        </div>
        
        <q-table
          :rows="realTimeCryptoData"
          :columns="cryptoColumns"
          row-key="symbol"
          flat
          bordered
          :loading="cryptoLoading"
          :pagination="pagination"
          class="crypto-table"
          @request="onTableRequest"
        >
          <!-- Header personalizado -->
          <template v-slot:header="props">
            <q-tr :props="props">
              <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
                class="text-weight-bold text-grey-8"
              >
                <div class="column items-center">
                  {{ col.label }}
                  <q-icon 
                    v-if="col.name === pagination.sortBy" 
                    :name="pagination.descending ? 'arrow_downward' : 'arrow_upward'"
                    size="xs"
                  />
                </div>
              </q-th>
            </q-tr>
          </template>

          <!-- Celda de símbolo con icono -->
          <template v-slot:body-cell-symbol="props">
            <q-td :props="props" class="text-weight-bold">
              <div class="row items-center no-wrap">
                <q-avatar size="24px" class="q-mr-sm">
                  <img :src="getCryptoIcon(props.row.symbol)" :alt="props.row.symbol">
                </q-avatar>
                {{ props.row.symbol }}
              </div>
            </q-td>
          </template>

          <!-- Celda de precio con animación -->
          <template v-slot:body-cell-price="props">
            <q-td :props="props">
              <div class="column">
                <div class="text-weight-medium" :class="getPriceChangeClass(props.row)">
                  {{ formatCurrency(props.row.price) }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ formatCurrency(props.row.price * 38000) }} MXN
                </div>
              </div>
            </q-td>
          </template>
          
          <!-- Celda de cambio 24h -->
          <template v-slot:body-cell-change24h="props">
            <q-td :props="props">
              <q-badge 
                :color="props.row.change24h >= 0 ? 'green-1' : 'red-1'" 
                text-color="white"
                class="change-badge"
              >
                <q-icon 
                  :name="props.row.change24h >= 0 ? 'arrow_upward' : 'arrow_downward'" 
                  size="xs" 
                  class="q-mr-xs"
                />
                <span :class="props.row.change24h >= 0 ? 'text-positive' : 'text-negative'">
                  {{ props.row.change24h >= 0 ? '+' : '' }}{{ props.row.change24h.toFixed(2) }}%
                </span>
              </q-badge>
            </q-td>
          </template>

          <!-- Celda de market cap -->
          <template v-slot:body-cell-marketCap="props">
            <q-td :props="props" class="text-grey-7">
              {{ formatCompactCurrency(props.row.marketCap) }}
            </q-td>
          </template>

          <!-- Celda de volumen -->
          <template v-slot:body-cell-volume24h="props">
            <q-td :props="props" class="text-grey-7">
              {{ formatCompactCurrency(props.row.volume24h) }}
            </q-td>
          </template>

          <!-- Loading state -->
          <template v-slot:loading>
            <q-inner-loading showing color="primary">
              <q-spinner-gears size="50px" color="primary" />
              <div class="q-mt-md">{{ t('banking.dashboard.loadingData') }}</div>
            </q-inner-loading>
          </template>
        </q-table>

        <!-- Resumen rápido -->
        <div v-if="realTimeCryptoData.length > 0" class="row q-mt-md q-gutter-sm">
          <q-badge color="blue-1" text-color="blue-8" class="summary-badge">
            {{ t('banking.dashboard.topGainer') }}: {{ topGainer.symbol }} (+{{ topGainer.change.toFixed(2) }}%)
          </q-badge>
          <q-badge color="orange-1" text-color="orange-8" class="summary-badge">
            {{ t('banking.dashboard.topLoser') }}: {{ topLoser.symbol }} ({{ topLoser.change.toFixed(2) }}%)
          </q-badge>
          <q-badge color="green-1" text-color="green-8" class="summary-badge">
            {{ t('banking.dashboard.totalMarketCap') }}: {{ totalMarketCap }}
          </q-badge>
        </div>
      </q-card-section>
    </q-card>

    <!-- Gráficos en Tiempo Real -->
    <div class="row q-col-gutter-md q-mt-lg">
      <div class="col-12 col-md-8">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold">{{ t('banking.dashboard.priceChart') }}</div>
            <div class="chart-container q-pa-md">
              <div class="price-indicator">
                <div class="current-price text-h4 text-weight-bold">
                  {{ currentBTCPrice }}
                </div>
                <div class="price-change" :class="btcChange >= 0 ? 'text-positive' : 'text-negative'">
                  <q-icon :name="btcChange >= 0 ? 'arrow_upward' : 'arrow_downward'" />
                  {{ btcChange >= 0 ? '+' : '' }}{{ btcChange.toFixed(2) }}%
                </div>
              </div>
              <div class="chart-placeholder">
                <q-icon name="show_chart" size="xl" class="q-mb-sm" />
                <div>{{ t('banking.dashboard.liveChart') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      
      <div class="col-12 col-md-4">
        <q-card flat bordered class="activity-card">
          <q-card-section>
            <div class="text-h6 text-weight-bold">{{ t('banking.dashboard.marketOverview') }}</div>
            <div class="market-stats q-mt-md">
              <div v-for="stat in marketStats" :key="stat.label" class="stat-item q-py-sm">
                <div class="row items-center justify-between">
                  <span class="text-caption text-grey-7">{{ stat.label }}</span>
                  <span class="text-weight-medium" :class="stat.color">{{ stat.value }}</span>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBankingStore } from '../stores/banking-store';
import { websocketService, type CryptoUpdate } from '../../../services/websocket-service';
interface CryptoColumn {
  name: string;
  label: string;
  field: string;
  align: 'left' | 'right' | 'center';
  sortable: boolean;
}
const { t } = useI18n();
const bankingStore = useBankingStore();
const cryptoLoading = ref(true);
const refreshing = ref(false);
const selectedInterval = ref('realtime');


// Métodos de utilidad
const getDefaultColor = (index: number) => {
  const colors = ['blue', 'green', 'purple', 'orange'];
  return colors[index % colors.length];
};

const getStatIcon = (index: number) => {
  const icons = ['receipt_long', 'payments', 'account_balance', 'trending_up'];
  return icons[index % icons.length];
};

const getProgressColor = (percentage: number) => {
  if (percentage >= 80) return 'green';
  if (percentage >= 60) return 'blue';
  if (percentage >= 40) return 'orange';
  return 'red';
};

const handleStatClick = (stat: any) => {
  console.log('Stat clicked:', stat.title);
  // Aquí puedes agregar funcionalidad al hacer clic
  // Por ejemplo: navegar a una vista detallada, mostrar modal, etc.
};

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Opciones de intervalo de actualización
const intervalOptions = [
  { label: 'Tiempo real', value: 'realtime' },
  { label: '5 segundos', value: '5s' },
  { label: '15 segundos', value: '15s' },
  { label: '30 segundos', value: '30s' }
];

// Datos en tiempo real desde WebSocket
const realTimeCryptoData = computed(() => websocketService.cryptoData.value);

// Configuración de paginación
const pagination = ref({
  sortBy: 'marketCap',
  descending: true,
  page: 1,
  rowsPerPage: 10
});

// Formatear última actualización
const formattedLastUpdate = computed(() => {
  return websocketService.lastUpdate.value.toLocaleTimeString();
});

// Estadísticas del mercado
const marketStats = computed(() => [
  { label: t('banking.dashboard.totalCryptos'), value: realTimeCryptoData.value.length, color: 'text-blue' },
  { label: t('banking.dashboard.marketCap'), value: totalMarketCap.value, color: 'text-green' },
  { label: t('banking.dashboard.volume24h'), value: totalVolume.value, color: 'text-orange' },
  { label: t('banking.dashboard.dominanceBTC'), value: btcDominance.value, color: 'text-grey-7' }
]);

// Computed values
const topGainer = computed(() => {
  if (realTimeCryptoData.value.length === 0) return { symbol: '-', change: 0 };
  const sorted = [...realTimeCryptoData.value].sort((a, b) => b.change24h - a.change24h);
  const top = sorted[0];
  // Verificación adicional para TypeScript
  if (!top) return { symbol: '-', change: 0 };
  return { symbol: top.symbol, change: top.change24h };
});

const topLoser = computed(() => {
  if (realTimeCryptoData.value.length === 0) return { symbol: '-', change: 0 };
  const sorted = [...realTimeCryptoData.value].sort((a, b) => a.change24h - b.change24h);
  const bottom = sorted[0];
  // Verificación adicional para TypeScript
  if (!bottom) return { symbol: '-', change: 0 };
  return { symbol: bottom.symbol, change: bottom.change24h };
});

const totalMarketCap = computed(() => {
  if (realTimeCryptoData.value.length === 0) return '-';
  const total = realTimeCryptoData.value.reduce((sum, crypto) => sum + crypto.marketCap, 0);
  return formatCompactCurrency(total);
});

const totalVolume = computed(() => {
  if (realTimeCryptoData.value.length === 0) return '-';
  const total = realTimeCryptoData.value.reduce((sum, crypto) => sum + crypto.volume24h, 0);
  return formatCompactCurrency(total);
});

const btcDominance = computed(() => {
  if (realTimeCryptoData.value.length === 0) return '0%';
  const btc = realTimeCryptoData.value.find(c => c.symbol === 'BTC');
  const totalMarketCap = realTimeCryptoData.value.reduce((sum, crypto) => sum + crypto.marketCap, 0);
  return btc ? ((btc.marketCap / totalMarketCap) * 100).toFixed(1) + '%' : '0%';
});

const currentBTCPrice = computed(() => {
  const btc = realTimeCryptoData.value.find(c => c.symbol === 'BTC');
  return btc ? formatCurrency(btc.price) : '-';
});

const btcChange = computed(() => {
  const btc = realTimeCryptoData.value.find(c => c.symbol === 'BTC');
  return btc ? btc.change24h : 0;
});

// Estadísticas mejoradas con más datos
const statsCards = computed(() => [
  {
    title: t('banking.dashboard.totalTransactions'),
    value: formatNumber(bankingStore.dailyStats.totalTransactions),
    icon: 'receipt_long',
    color: 'blue',
    trend: 12.5, // % de cambio vs ayer
    percentage: 85, // % de objetivo diario
    subtitle: t('banking.dashboard.dailyGoal'),
    tooltip: t('banking.dashboard.transactionsTooltip'),
    loading: false
  },
  {
    title: t('banking.dashboard.totalAmount'),
    value: formatCurrency(bankingStore.dailyStats.totalAmount),
    icon: 'payments',
    color: 'green',
    trend: 8.3,
    percentage: 72,
    subtitle: t('banking.dashboard.monthlyAverage'),
    tooltip: t('banking.dashboard.amountTooltip'),
    loading: false
  },
  {
    title: t('banking.dashboard.mostActiveAccount'),
    value: bankingStore.dailyStats.mostActiveAccount || t('banking.dashboard.notAvailable'),
    icon: 'account_balance',
    color: 'purple',
    trend: 15.2,
    subtitle: t('banking.dashboard.activeUsers'),
    tooltip: t('banking.dashboard.activeAccountTooltip'),
    loading: false
  },
  {
    title: t('banking.dashboard.averageTransaction'),
    value: formatCurrency(bankingStore.dailyStats.averageTransaction),
    icon: 'trending_up',
    color: 'orange',
    trend: -2.1,
    percentage: 45,
    subtitle: t('banking.dashboard.avgComparedToWeek'),
    tooltip: t('banking.dashboard.averageTooltip'),
    loading: false
  }
]);

const cryptoColumns = computed<CryptoColumn[]>(() => [
  { 
    name: 'symbol', 
    label: t('banking.dashboard.symbol'), 
    field: 'symbol', 
    align: 'left',
    sortable: true
  },
  { 
    name: 'price', 
    label: t('banking.dashboard.price'), 
    field: 'price', 
    align: 'right',
    sortable: true
  },
  { 
    name: 'change24h', 
    label: t('banking.dashboard.change24h'), 
    field: 'change24h', 
    align: 'right',
    sortable: true
  },
  { 
    name: 'marketCap', 
    label: t('banking.dashboard.marketCap'), 
    field: 'marketCap', 
    align: 'right',
    sortable: true
  },
  { 
    name: 'volume24h', 
    label: t('banking.dashboard.volume24h'), 
    field: 'volume24h', 
    align: 'right',
    sortable: true
  }
]);

// Métodos
const getCryptoIcon = (symbol: string) => {
  const icons: { [key: string]: string } = {
    'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    'SOL': 'https://cryptologos.cc/logos/solana-sol-logo.png',
    'ADA': 'https://cryptologos.cc/logos/cardano-ada-logo.png',
    'DOT': 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png'
  };
  return icons[symbol] || 'https://cryptologos.cc/logos/bitcoin-btc-logo.png';
};

const getPriceChangeClass = (crypto: CryptoUpdate) => {
  return crypto.change24h >= 0 ? 'text-positive' : 'text-negative';
};

const manualRefresh = () => {
  refreshing.value = true;
  // Simular refresh
  setTimeout(() => {
    refreshing.value = false;
  }, 1000);
};

const onTableRequest = (props: any) => {
  pagination.value = props.pagination;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatCompactCurrency = (amount: number) => {
  if (amount >= 1e12) return '$' + (amount / 1e12).toFixed(2) + 'T';
  if (amount >= 1e9) return '$' + (amount / 1e9).toFixed(2) + 'B';
  if (amount >= 1e6) return '$' + (amount / 1e6).toFixed(2) + 'M';
  return formatCurrency(amount);
};

onMounted(() => {
  setTimeout(() => {
    cryptoLoading.value = false;
  }, 2000);
});

onUnmounted(() => {
  websocketService.disconnect();
});
</script>

<style scoped>
.connection-badge {
  font-size: 0.8em;
  padding: 4px 8px;
}

.chart-container {
  position: relative;
}

.price-indicator {
  text-align: center;
  margin-bottom: 20px;
}

.current-price {
  margin-bottom: 5px;
}

.price-change {
  font-size: 1.1em;
}

.market-stats .stat-item {
  border-bottom: 1px solid rgba(0,0,0,0.05);
}

.market-stats .stat-item:last-child {
  border-bottom: none;
}

/* Animaciones para cambios de precio */
.text-positive {
  transition: color 0.3s ease;
}

.text-negative {
  transition: color 0.3s ease;
}

.change-badge {
  transition: all 0.3s ease;
}
</style>

<style scoped>
.improved-stat-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border-left: 4px solid transparent;
}

.improved-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.improved-stat-card.positive-trend {
  border-left-color: var(--q-positive);
}

.improved-stat-card.negative-trend {
  border-left-color: var(--q-negative);
}

.stat-value {
  background: linear-gradient(135deg, var(--q-primary), var(--q-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Colores específicos para cada tarjeta */
.stat-card-0:hover {
  border-left-color: #2196F3;
}

.stat-card-1:hover {
  border-left-color: #4CAF50;
}

.stat-card-2:hover {
  border-left-color: #9C27B0;
}

.stat-card-3:hover {
  border-left-color: #FF9800;
}

/* Responsive improvements */
@media (max-width: 600px) {
  .improved-stat-card {
    margin-bottom: 8px;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}

/* Animaciones */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.stat-card.updating {
  animation: pulse 1s ease-in-out;
}
</style>