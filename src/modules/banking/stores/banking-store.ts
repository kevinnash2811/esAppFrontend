import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Account, Transaction, BankingStats } from '../types/banking';
import { notificationService  }from '../../../services/notification-service'

// Claves para localStorage
const STORAGE_KEYS = {
  ACCOUNTS: 'banking-accounts',
  TRANSACTIONS: 'banking-transactions'
};

// Datos iniciales
const initialAccounts: Account[] = [
  {
    id: 'acc_001',
    accountNumber: '001-123456-01',
    type: 'checking',
    holderName: 'Juan Pérez',
    holderPhoto: 'https://cdn.quasar.dev/img/avatar1.jpg',
    balance: 15000.50,
    currency: 'USD',
    bankName: 'Banco Central'
  },
  {
    id: 'acc_002',
    accountNumber: '001-123457-01',
    type: 'savings',
    holderName: 'María García',
    holderPhoto: 'https://cdn.quasar.dev/img/avatar2.jpg',
    balance: 25000.75,
    currency: 'USD',
    bankName: 'Banco Central'
  },
  {
    id: 'acc_003',
    accountNumber: '001-123458-01',
    type: 'business',
    holderName: 'Empresa XYZ',
    holderPhoto: 'https://cdn.quasar.dev/img/avatar4.jpg',
    balance: 100000.00,
    currency: 'USD',
    bankName: 'Banco Central'
  }
];

// Helper functions para localStorage
const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
};

export const useBankingStore = defineStore('banking', () => {
  // Estado - Cargar desde localStorage o usar valores por defecto
  const accounts = ref<Account[]>(loadFromStorage(STORAGE_KEYS.ACCOUNTS, initialAccounts));
  const transactions = ref<Transaction[]>(loadFromStorage(STORAGE_KEYS.TRANSACTIONS, []));
  
  const selectedFromAccount = ref<Account | null>(null);
  const selectedToAccount = ref<Account | null>(null);
  const transferAmount = ref<number>(0);

  // Watchers para persistir cambios automáticamente
  watch(
    accounts,
    (newAccounts) => {
      saveToStorage(STORAGE_KEYS.ACCOUNTS, newAccounts);
    },
    { deep: true }
  );

  watch(
    transactions,
    (newTransactions) => {
      saveToStorage(STORAGE_KEYS.TRANSACTIONS, newTransactions);
    },
    { deep: true }
  );

  // Getters computados
  const dailyStats = computed<BankingStats>(() => {
    const todayTransactions = transactions.value.filter(t => 
      new Date(t.timestamp).toDateString() === new Date().toDateString()
    );
    
    const totalAmount = todayTransactions.reduce((sum, t) => sum + t.amount, 0);
    const accountCounts: Record<string, number> = {};
    
    todayTransactions.forEach(t => {
      accountCounts[t.fromAccountId] = (accountCounts[t.fromAccountId] || 0) + 1;
    });
    
    const mostActiveAccount = Object.keys(accountCounts).reduce((a, b) => {
      // Verificar que ambas keys existan en accountCounts
      const countA = accountCounts[a] || 0;
      const countB = accountCounts[b] || 0;
      return countA > countB ? a : b;
    }, '');

    return {
      totalTransactions: todayTransactions.length,
      totalAmount,
      mostActiveAccount: accounts.value.find(a => a.id === mostActiveAccount)?.holderName || '',
      averageTransaction: todayTransactions.length ? totalAmount / todayTransactions.length : 0
    };
  });

  const filteredTransactions = computed(() => (filters: { 
    accountId?: string; 
    minAmount?: number; 
    maxAmount?: number;
  }) => {
    const today = new Date();
    
    return transactions.value.filter(t => {
      // Filtrar por fecha (solo hoy)
      const isToday = new Date(t.timestamp).toDateString() === today.toDateString();
      if (!isToday) return false;
      
      // Filtrar por cuenta
      const matchesAccount = !filters.accountId || 
        t.fromAccountId === filters.accountId || 
        t.toAccountId === filters.accountId;
      
      // Filtrar por monto
      const matchesMinAmount = !filters.minAmount || t.amount >= filters.minAmount;
      const matchesMaxAmount = !filters.maxAmount || t.amount <= filters.maxAmount;
      
      return matchesAccount && matchesMinAmount && matchesMaxAmount;
    });
  });

  // Actions
  const setFromAccount = (account: Account) => {
    selectedFromAccount.value = account;
  };

  const setToAccount = (account: Account) => {
    selectedToAccount.value = account;
  };

  const setTransferAmount = (amount: number) => {
    transferAmount.value = amount;
  };

  const validateTransfer = () => {
    const errors: string[] = [];

    if (!selectedFromAccount.value) {
      errors.push('Selecciona una cuenta de origen');
    }

    if (!selectedToAccount.value) {
      errors.push('Selecciona una cuenta de destino');
    }

    if (selectedFromAccount.value && selectedToAccount.value && 
        selectedFromAccount.value.id === selectedToAccount.value.id) {
      errors.push('No puedes transferir a la misma cuenta');
    }

    if (transferAmount.value <= 0) {
      errors.push('El monto debe ser mayor a 0');
    }

    if (selectedFromAccount.value && transferAmount.value > selectedFromAccount.value.balance) {
      errors.push('Saldo insuficiente');
    }

    return errors;
  };

  const executeTransfer = (description?: string): boolean => {
    const errors = validateTransfer();
    if (errors.length > 0) {
      notificationService.error(
        'Error de validación',
        errors.join(', ')
      );
      return false;
    }

    if (!selectedFromAccount.value || !selectedToAccount.value) {
      return false;
    }

    // Crear transacción
    const transaction: Transaction = {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fromAccountId: selectedFromAccount.value.id,
      toAccountId: selectedToAccount.value.id,
      amount: transferAmount.value,
      currency: selectedFromAccount.value.currency,
      timestamp: new Date(),
      status: 'completed',
      description
    };

    // Actualizar saldos
    const fromAccount = accounts.value.find(a => a.id === selectedFromAccount.value!.id);
    const toAccount = accounts.value.find(a => a.id === selectedToAccount.value!.id);
    
    if (fromAccount && toAccount) {
      fromAccount.balance -= transferAmount.value;
      toAccount.balance += transferAmount.value;
    }

    // Agregar transacción al historial
    transactions.value.unshift(transaction);

    // Limpiar formulario
    selectedFromAccount.value = null;
    selectedToAccount.value = null;
    transferAmount.value = 0;

    notificationService.success(
      'Transacción completada',
      `Transferencia de $${transferAmount.value} procesada correctamente`
    );
    return true;
  };

  const getAccountById = (id: string) => {
    return accounts.value.find(account => account.id === id);
  };

  // Métodos para gestión de datos
  const exportData = () => {
    const data = {
      accounts: accounts.value,
      transactions: transactions.value,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-transacciones-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          
          if (data.accounts && data.transactions) {
            accounts.value = data.accounts;
            transactions.value = data.transactions;
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (error) {
          console.error('Error importing data:', error);
          resolve(false);
        }
      };
      
      reader.readAsText(file);
    });
  };

  const clearAllData = () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      accounts.value = [...initialAccounts];
      transactions.value = [];
    }
  };

  const getStorageInfo = () => {
    const accountsSize = JSON.stringify(accounts.value).length;
    const transactionsSize = JSON.stringify(transactions.value).length;
    
    return {
      totalAccounts: accounts.value.length,
      totalTransactions: transactions.value.length,
      storageSize: (accountsSize + transactionsSize) / 1024, // KB
      lastUpdate: new Date().toLocaleString()
    };
  };

  return {
    // Estado
    accounts,
    transactions,
    selectedFromAccount,
    selectedToAccount,
    transferAmount,
    
    // Getters
    dailyStats,
    filteredTransactions,
    
    // Actions
    setFromAccount,
    setToAccount,
    setTransferAmount,
    validateTransfer,
    executeTransfer,
    getAccountById,
    
    // Métodos de gestión de datos
    exportData,
    importData,
    clearAllData,
    getStorageInfo
  };
});