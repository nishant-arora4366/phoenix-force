/**
 * Centralized logging utility
 * In production, console statements are disabled
 * In development, they are enabled for debugging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  data?: any
}

class Logger {
  private static instance: Logger
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logBuffer: LogEntry[] = []
  private maxBufferSize = 100

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log errors
    if (!this.isDevelopment && level !== 'error') {
      return false
    }
    return true
  }

  private addToBuffer(entry: LogEntry) {
    this.logBuffer.push(entry)
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift()
    }
  }

  debug(message: string, data?: any) {
    const entry: LogEntry = {
      level: 'debug',
      message,
      timestamp: new Date(),
      data
    }
    
    this.addToBuffer(entry)
    
    if (this.shouldLog('debug')) {
      // Development only
      if (data) {
        console.log(`[DEBUG] ${message}`, data)
      } else {
        console.log(`[DEBUG] ${message}`)
      }
    }
  }

  info(message: string, data?: any) {
    const entry: LogEntry = {
      level: 'info',
      message,
      timestamp: new Date(),
      data
    }
    
    this.addToBuffer(entry)
    
    if (this.shouldLog('info')) {
      if (data) {
        console.info(`[INFO] ${message}`, data)
      } else {
        console.info(`[INFO] ${message}`)
      }
    }
  }

  warn(message: string, data?: any) {
    const entry: LogEntry = {
      level: 'warn',
      message,
      timestamp: new Date(),
      data
    }
    
    this.addToBuffer(entry)
    
    if (this.shouldLog('warn')) {
      if (data) {
        console.warn(`[WARN] ${message}`, data)
      } else {
        console.warn(`[WARN] ${message}`)
      }
    }
  }

  error(message: string, error?: any) {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date(),
      data: error
    }
    
    this.addToBuffer(entry)
    
    if (this.shouldLog('error')) {
      if (error) {
        console.error(`[ERROR] ${message}`, error)
      } else {
        console.error(`[ERROR] ${message}`)
      }
      
      // In production, send to error reporting service
      if (!this.isDevelopment && typeof window !== 'undefined') {
        // Send to error reporting service (e.g., Sentry)
        this.reportToService(entry)
      }
    }
  }

  private reportToService(entry: LogEntry) {
    // Implement error reporting service integration
    // For example: Sentry, LogRocket, etc.
    try {
      // Example: window.Sentry?.captureException(entry.data)
    } catch {
      // Fail silently
    }
  }

  getRecentLogs(count: number = 50): LogEntry[] {
    return this.logBuffer.slice(-count)
  }

  clearLogs() {
    this.logBuffer = []
  }
}

export const logger = Logger.getInstance()

// Export convenience functions
export const logDebug = (message: string, data?: any) => logger.debug(message, data)
export const logInfo = (message: string, data?: any) => logger.info(message, data)
export const logWarn = (message: string, data?: any) => logger.warn(message, data)
export const logError = (message: string, error?: any) => logger.error(message, error)

export default logger
