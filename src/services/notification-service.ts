import { Notify } from 'quasar'

export interface NotificationOptions {
  type?: 'positive' | 'negative' | 'warning' | 'info' | 'ongoing'
  timeout?: number
  icon?: string
  color?: string
  textColor?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center'
  actions?: Array<{ label: string; color?: string; handler: () => void }>
  progress?: boolean
  multiLine?: boolean
}

class NotificationService {
  // Notificación de éxito
  success(message: string, caption?: string, options: Partial<NotificationOptions> = {}) {
    Notify.create({
      type: 'positive',
      message,
      caption,
      icon: 'check_circle',
      timeout: 3000,
      position: 'top-right',
      ...options
    })
  }

  // Notificación de error
  error(message: string, caption?: string, options: Partial<NotificationOptions> = {}) {
    Notify.create({
      type: 'negative',
      message,
      caption,
      icon: 'error',
      timeout: 5000,
      position: 'top-right',
      ...options
    })
  }

  // Notificación de advertencia
  warning(message: string, caption?: string, options: Partial<NotificationOptions> = {}) {
    Notify.create({
      type: 'warning',
      message,
      caption,
      icon: 'warning',
      timeout: 4000,
      position: 'top-right',
      ...options
    })
  }

  // Notificación informativa
  info(message: string, caption?: string, options: Partial<NotificationOptions> = {}) {
    Notify.create({
      type: 'info',
      message,
      caption,
      icon: 'info',
      timeout: 3000,
      position: 'top-right',
      ...options
    })
  }

  // Notificación de carga/proceso
  loading(message: string, caption?: string, options: Partial<NotificationOptions> = {}) {
    return Notify.create({
      type: 'ongoing',
      message,
      caption,
      icon: 'hourglass_empty',
      timeout: 0, // No se cierra automáticamente
      position: 'top-right',
      ...options
    })
  }

  // Notificación personalizada
  custom(options: NotificationOptions & { message: string }) {
    Notify.create(options)
  }

  // Cerrar todas las notificaciones
  // closeAll() {
  //   Notify.clear()
  // }

  // Notificación de transacción exitosa (específica para banking)
  transactionSuccess(amount: number, fromAccount: string, toAccount: string) {
    this.success(
      'Transferencia exitosa',
      `Se transfirió $${amount} de ${fromAccount} a ${toAccount}`,
      {
        icon: 'account_balance',
        actions: [
          {
            label: 'Ver detalle',
            color: 'white',
            handler: () => {
              // Navegar al historial o mostrar detalles
              console.log('Ver detalle de transacción')
            }
          }
        ]
      }
    )
  }

  // Notificación de error de saldo insuficiente
  insufficientBalance(amount: number, currentBalance: number) {
    this.error(
      'Saldo insuficiente',
      `Intentaste transferir $${amount} pero tu saldo es $${currentBalance}`,
      {
        icon: 'account_balance_wallet',
        actions: [
          {
            label: 'Recargar',
            color: 'yellow',
            handler: () => {
              console.log('Ir a recarga de saldo')
            }
          }
        ]
      }
    )
  }

  // Notificación de nueva transacción recibida (en tiempo real)
  incomingTransaction(amount: number, fromUser: string) {
    this.info(
      'Nueva transferencia recibida',
      `$${amount} de ${fromUser}`,
      {
        icon: 'payments',
        timeout: 6000,
        actions: [
          {
            label: 'Aceptar',
            color: 'green',
            handler: () => {
              console.log('Transacción aceptada')
            }
          },
          {
            label: 'Rechazar',
            color: 'red',
            handler: () => {
              console.log('Transacción rechazada')
            }
          }
        ]
      }
    )
  }
}

export const notificationService = new NotificationService()
export default notificationService