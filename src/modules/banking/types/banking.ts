export interface Account {
  id: string;
  accountNumber: string;
  type: 'checking' | 'savings' | 'business';
  holderName: string;
  holderPhoto?: string;
  balance: number;
  currency: string;
  bankName: string;
}

export interface Transaction {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: string;
  timestamp: Date;
  status: 'completed' | 'failed' | 'pending';
  description?: string;
}

export interface CryptoCurrency {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export interface BankingStats {
  totalTransactions: number;
  totalAmount: number;
  mostActiveAccount: string;
  averageTransaction: number;
}