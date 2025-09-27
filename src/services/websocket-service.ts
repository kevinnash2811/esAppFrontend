import { ref } from 'vue'

export interface CryptoUpdate {
  symbol: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  lastUpdated: number
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectInterval = 3000
  private symbols = ['btcusdt', 'ethusdt', 'solusdt', 'adausdt', 'dotusdt', 'dogeusdt']
  
  public cryptoData = ref<CryptoUpdate[]>([])
  public isConnected = ref(false)
  public lastUpdate = ref<Date>(new Date())
  private priceHistory = new Map<string, number[]>()

  constructor() {
    this.initializeMockData()
    this.connect()
  }

  private initializeMockData() {
    // Datos iniciales mock
    this.cryptoData.value = [
      {
        symbol: 'BTC',
        price: 45000,
        change24h: 2.5,
        marketCap: 880000000000,
        volume24h: 25000000000,
        lastUpdated: Date.now()
      },
      {
        symbol: 'ETH',
        price: 3200,
        change24h: 1.8,
        marketCap: 385000000000,
        volume24h: 15000000000,
        lastUpdated: Date.now()
      },
      {
        symbol: 'SOL',
        price: 105,
        change24h: 5.2,
        marketCap: 45000000000,
        volume24h: 3000000000,
        lastUpdated: Date.now()
      },
      {
        symbol: 'ADA',
        price: 0.48,
        change24h: -0.5,
        marketCap: 17000000000,
        volume24h: 800000000,
        lastUpdated: Date.now()
      },
      {
        symbol: 'DOT',
        price: 6.8,
        change24h: 1.2,
        marketCap: 8700000000,
        volume24h: 400000000,
        lastUpdated: Date.now()
      },
      {
        symbol: 'DOGE',
        price: 0.12,
        change24h: 3.1,
        marketCap: 17000000000,
        volume24h: 1200000000,
        lastUpdated: Date.now()
      }
    ]

    // Inicializar historial de precios
    this.cryptoData.value.forEach(crypto => {
      this.priceHistory.set(crypto.symbol, [crypto.price])
    })
  }

  private connect() {
    try {
      // WebSocket de Binance para datos en tiempo real
      this.ws = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr')
      
      this.ws.onopen = () => {
        console.log('WebSocket de Binance conectado')
        this.isConnected.value = true
        this.reconnectAttempts = 0
      }

      this.ws.onmessage = (event) => {
        this.handleBinanceMessage(event.data)
      }

      this.ws.onclose = () => {
        console.log('WebSocket desconectado')
        this.isConnected.value = false
        this.handleReconnection()
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        this.isConnected.value = false
      }

    } catch (error) {
      console.error('Error al conectar WebSocket:', error)
      this.handleReconnection()
    }
  }

  private handleBinanceMessage(data: string) {
    try {
      const updates = JSON.parse(data)
      
      updates.forEach((update: any) => {
        const symbol = update.s.replace('USDT', '')
        
        // Solo procesar los símbolos que nos interesan
        if (this.symbols.includes(update.s.toLowerCase())) {
          this.processBinanceUpdate(update, symbol)
        }
      })
      
      this.lastUpdate.value = new Date()
    } catch (error) {
      console.error('Error procesando mensaje WebSocket:', error)
    }
  }

  private processBinanceUpdate(update: any, symbol: string) {
    const price = parseFloat(update.c)
    const priceChangePercent = parseFloat(update.P)
    const volume = parseFloat(update.v)
    const cleanSymbol = symbol.replace('USDT', '')

    // Usar find en lugar de findIndex para obtener el objeto directamente
    const existing = this.cryptoData.value.find(item => item.symbol === cleanSymbol)

    if (existing) {
      const existingIndex = this.cryptoData.value.indexOf(existing)
      
      // Actualizar historial de precios
      const history = this.priceHistory.get(existing.symbol) || []
      history.push(price)
      if (history.length > 10) history.shift()
      this.priceHistory.set(existing.symbol, history)

      // Crear nuevo objeto explícitamente
      const updatedCrypto: CryptoUpdate = {
        symbol: existing.symbol,
        price: price,
        change24h: priceChangePercent,
        marketCap: existing.marketCap,
        volume24h: volume * price,
        lastUpdated: Date.now()
      }

      this.cryptoData.value[existingIndex] = updatedCrypto
    }
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Intentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      
      setTimeout(() => {
        this.connect()
      }, this.reconnectInterval)
    } else {
      console.error('Máximo número de intentos de reconexión alcanzado')
      this.fallbackToMockData()
    }
  }

  private fallbackToMockData() {
    console.log('Usando datos mock como fallback')
    
    // Simular actualizaciones periódicas más realistas
    setInterval(() => {
      this.simulateRealisticPriceChanges()
    }, 2000)
  }

  private simulateRealisticPriceChanges() {
    this.cryptoData.value = this.cryptoData.value.map(crypto => {
      // Cambio más realista basado en volatilidad del crypto
      const volatility = this.getVolatility(crypto.symbol)
      const change = (Math.random() - 0.5) * volatility
      const newPrice = crypto.price * (1 + change / 100)
      
      // Actualizar historial
      const history = this.priceHistory.get(crypto.symbol) || []
      history.push(newPrice)
      if (history.length > 10) history.shift()
      this.priceHistory.set(crypto.symbol, history)

      return {
        ...crypto,
        price: parseFloat(newPrice.toFixed(this.getDecimalPlaces(crypto.symbol))),
        change24h: parseFloat((crypto.change24h + change).toFixed(2)),
        volume24h: crypto.volume24h * (1 + (Math.random() - 0.3) / 10),
        lastUpdated: Date.now()
      }
    })
    
    this.lastUpdate.value = new Date()
  }

  private getVolatility(symbol: string): number {
    const volatilities: { [key: string]: number } = {
      'BTC': 0.8,
      'ETH': 1.2,
      'SOL': 3.0,
      'ADA': 2.5,
      'DOT': 2.0,
      'DOGE': 4.0
    }
    return volatilities[symbol] || 1.5
  }

  private getDecimalPlaces(symbol: string): number {
    const decimals: { [key: string]: number } = {
      'BTC': 2,
      'ETH': 2,
      'SOL': 2,
      'ADA': 4,
      'DOT': 3,
      'DOGE': 4
    }
    return decimals[symbol] || 2
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  // Método para obtener el historial de precios de un símbolo
  public getPriceHistory(symbol: string): number[] {
    return this.priceHistory.get(symbol) || []
  }
}

export const websocketService = new WebSocketService()