import { ref } from 'vue';
import type { CryptoCurrency } from '../types/banking';

class CryptoService {
  private cryptocurrencies = ref<CryptoCurrency[]>([]);
  private ws: WebSocket | null = null;

  constructor() {
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    // Simular conexión WebSocket con datos mock
    this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');
    
    this.ws.onopen = () => {
      console.log('Conectado al mercado de criptomonedas');
      this.loadInitialData();
    };

    this.ws.onmessage = () => {
      // En producción, procesarías datos reales aquí
      // Por ahora, simulamos actualizaciones periódicas
      this.simulatePriceUpdates();
    };

    // Simular datos iniciales
    this.loadInitialData();
  }

  private loadInitialData() {
    this.cryptocurrencies.value = [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 45000,
        change24h: 2.5,
        marketCap: 880000000000
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3200,
        change24h: 1.8,
        marketCap: 385000000000
      },
      {
        symbol: 'BNB',
        name: 'Binance Coin',
        price: 550,
        change24h: -0.5,
        marketCap: 85000000000
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        price: 120,
        change24h: 5.2,
        marketCap: 52000000000
      }
    ];
  }

  private simulatePriceUpdates() {
    setInterval(() => {
      this.cryptocurrencies.value = this.cryptocurrencies.value.map(crypto => ({
        ...crypto,
        price: crypto.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% cambio
        change24h: crypto.change24h + (Math.random() - 0.5) * 0.5
      }));
    }, 5000);
  }

  getCryptocurrencies() {
    return this.cryptocurrencies;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const cryptoService = new CryptoService();