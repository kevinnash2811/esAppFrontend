<template>
  <q-card>
    <q-card-section>
      <div class="text-h6">{{ t('banking.simulator.title') }}</div>
    </q-card-section>

    <q-card-section class="q-gutter-md">
      <!-- Selector Cuenta Origen -->
      <div>
        <div class="text-subtitle2">{{ t('banking.simulator.fromAccount') }}</div>
        <q-select
          v-model="fromAccountId"
          :options="accountOptions"
          option-label="holderName"
          option-value="id"
          emit-value
          map-options
          clearable
          :label="t('banking.simulator.labelOriginAccount')"
          @update:model-value="onFromAccountChange"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-avatar>
                  <img :src="scope.opt.holderPhoto || '/avatars/default.jpg'" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.holderName }}</q-item-label>
                <q-item-label caption>{{ scope.opt.accountNumber }} - {{ getAccountTypeText(scope.opt.type) }}</q-item-label>
                <q-item-label caption>{{ t('banking.simulator.balance') }}: {{ formatCurrency(scope.opt.balance) }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Selector Cuenta Destino -->
      <div>
        <div class="text-subtitle2">{{ t('banking.simulator.toAccount') }}</div>
        <q-select
          v-model="toAccountId"
          :options="filteredToAccounts"
          option-label="holderName"
          option-value="id"
          emit-value
          map-options
          clearable
          :label="t('banking.simulator.labelDestinationAccount')"
          @update:model-value="onToAccountChange"
        >
          <template v-slot:option="scope">
            <q-item v-bind="scope.itemProps">
              <q-item-section avatar>
                <q-avatar>
                  <img :src="scope.opt.holderPhoto || '/avatars/default.jpg'" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ scope.opt.holderName }}</q-item-label>
                <q-item-label caption>{{ scope.opt.accountNumber }} - {{ getAccountTypeText(scope.opt.type) }}</q-item-label>
              </q-item-section>
            </q-item>
          </template>
        </q-select>
      </div>

      <!-- Monto -->
      <div>
        <div class="text-subtitle2">{{ t('banking.simulator.amount') }}</div>
        <q-input
          v-model="amountString"
          type="number"
          :label="t('banking.simulator.labelAmount')"
          prefix="$"
          @update:model-value="onAmountChange($event as string)"
          :rules="[val => validateAmount(val) || t('banking.simulator.alertLabel')]"
        />
        <!-- Debug: mostrar el valor actual -->
        <div class="text-caption text-grey">{{ t('banking.simulator.textInfo') }}: {{ amountString }} ({{ t('banking.simulator.type') }}: {{ typeof amountString }})</div>
      </div>

      <!-- Descripción -->
      <div>
        <div class="text-subtitle2">{{ t('banking.simulator.description') }}</div>
        <q-input
          v-model="description"
          :label="t('banking.simulator.labelDescription')"
        />
      </div>

      <!-- Validación -->
      <div v-if="validationErrors.length" class="text-negative q-pa-md bg-red-1 rounded-borders">
        <div v-for="error in validationErrors" :key="error" class="text-caption">
          • {{ error }}
        </div>
      </div>

      <!-- Resumen -->
      <q-card v-if="showSummary" flat class="bg-blue-1">
        <q-card-section>
          <div class="text-subtitle2">{{ t('banking.simulator.resument.title1') }}</div>
          <div>{{ t('banking.simulator.resument.title2') }} {{ fromAccountDisplay?.holderName }}</div>
          <div>{{ t('banking.simulator.resument.title3') }} {{ toAccountDisplay?.holderName }}</div>
          <div>{{ t('banking.simulator.resument.title4') }} {{ formatCurrency(amountNumber) }}</div>
          <div>{{ t('banking.simulator.resument.title5') }} {{ formatCurrency((fromAccountDisplay?.balance || 0) - amountNumber) }}</div>
        </q-card-section>
      </q-card>

      <!-- Botón Transferir -->
      <div>
        <q-btn 
          color="primary" 
          :label="t('banking.simulator.transfer')" 
          :disable="!canTransfer"
          @click="executeTransfer"
        />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useBankingStore } from '../stores/banking-store';
import { notificationService }  from '../../../services/notification-service.ts'

const { t } = useI18n();
const bankingStore = useBankingStore();

const fromAccountId = ref<string | null>(null);
const toAccountId = ref<string | null>(null);
const amountString = ref<string>(''); // Mantener como string para el input
const amountNumber = ref<number>(0); // Valor numérico para cálculos
const description = ref<string>('');

// Computed
const fromAccountDisplay = computed(() => 
  fromAccountId.value ? bankingStore.getAccountById(fromAccountId.value) : null
);

const toAccountDisplay = computed(() => 
  toAccountId.value ? bankingStore.getAccountById(toAccountId.value) : null
);

const accountOptions = computed(() => bankingStore.accounts);

const filteredToAccounts = computed(() => 
  bankingStore.accounts.filter(acc => acc.id !== fromAccountId.value)
);

const validationErrors = computed(() => {
  const errors: string[] = [];
  
  if (!fromAccountId.value) {
    errors.push(t('banking.simulator.validation.selectOriginAccount'));
  }

  if (!toAccountId.value) {
    errors.push(t('banking.simulator.validation.selectDestinationAccount'));
  }

  if (fromAccountId.value && toAccountId.value && fromAccountId.value === toAccountId.value) {
    errors.push(t('banking.simulator.validation.sameAccount'));
  }

  // Validación corregida del monto
  if (amountNumber.value <= 0) {
    errors.push(t('banking.simulator.alertLabel'));
  }

  if (fromAccountDisplay.value && amountNumber.value > fromAccountDisplay.value.balance) {
    errors.push(t('banking.simulator.validation.insufficientBalance'));
  }

  return errors;
});

const showSummary = computed(() => 
  !!fromAccountId.value && !!toAccountId.value && amountNumber.value > 0
);

const canTransfer = computed(() => 
  !!fromAccountId.value && !!toAccountId.value && amountNumber.value > 0 && validationErrors.value.length === 0
);

// Métodos
const onFromAccountChange = (accountId: string) => {
  bankingStore.setFromAccount(bankingStore.getAccountById(accountId)!);
};

const onToAccountChange = (accountId: string) => {
  bankingStore.setToAccount(bankingStore.getAccountById(accountId)!);
};

const onAmountChange = (value: string) => {
  // Convertir string a número
  const numValue = parseFloat(value) || 0;
  amountNumber.value = numValue;
  bankingStore.setTransferAmount(numValue);
};

const validateAmount = (value: string): boolean => {
  const numValue = parseFloat(value);
  return !isNaN(numValue) && numValue > 0;
};

const executeTransfer = () => {
  // Usar amountNumber en lugar de amountString
  bankingStore.setTransferAmount(amountNumber.value);
  const success = bankingStore.executeTransfer(description.value);
  
  if (success) {

     // Notificación de éxito
    notificationService.transactionSuccess(
      amountNumber.value,
      fromAccountDisplay.value?.holderName || '',
      toAccountDisplay.value?.holderName || ''
    );

    // Reset form
    fromAccountId.value = null;
    toAccountId.value = null;
    amountString.value = '';
    amountNumber.value = 0;
    description.value = '';
    
    // Mostrar notificación de éxito
    console.log('✅', t('banking.simulator.success'));
  } else {
    const errors = bankingStore.validateTransfer();
    
    // Notificación de error específica
    if (errors.includes('Saldo insuficiente') && fromAccountDisplay.value) {
      notificationService.insufficientBalance(
        amountNumber.value,
        fromAccountDisplay.value.balance
      );
    } else {
      // Error genérico
      notificationService.error(
        'Error en la transferencia',
        errors.join(', ')
      );
    }
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

const getAccountTypeText = (type: string) => {
  const typeMap: { [key: string]: string } = {
    'checking': t('banking.simulator.accountTypes.checking'),
    'savings': t('banking.simulator.accountTypes.savings'),
    'investment': t('banking.simulator.accountTypes.investment')
  };
  return typeMap[type] || type;
};
</script>