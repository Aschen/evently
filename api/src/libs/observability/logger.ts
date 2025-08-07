import type { AsyncLocalStorage } from 'node:async_hooks'
import pino from 'pino'
import { AppAsyncStorage } from 'src/libs/asyncStorage/AppAsyncStorage'

const pinoPretty = {
  target: 'pino-pretty',
  options: {
    colorize: true,
  },
}

function createLogger({
  appName,
  storage,
}: {
  appName: string
  storage: AsyncLocalStorage<{ requestId: string; hostname?: string }>
}) {
  if (process.env.NODE_ENV === 'test') {
    return {
      // eslint-disable-next-line no-console
      debug: console.log,
      // eslint-disable-next-line no-console
      info: console.log,
      // eslint-disable-next-line no-console
      warn: console.log,
      // eslint-disable-next-line no-console
      error: console.error,
      child: (options: { msgPrefix?: string }) => ({
        debug: (...args: any[]) =>
          // eslint-disable-next-line no-console
          console.log(options.msgPrefix ?? '', ...args),
        // eslint-disable-next-line no-console
        info: (...args: any[]) => console.log(options.msgPrefix ?? '', ...args),
        // eslint-disable-next-line no-console
        warn: (...args: any[]) => console.log(options.msgPrefix ?? '', ...args),
        error: (...args: any[]) =>
          // eslint-disable-next-line no-console
          console.error(options.msgPrefix ?? '', ...args),
        child: () => this,
      }),
    }
  }

  return pino({
    transport: process.env.NODE_ENV === 'production' ? undefined : pinoPretty,
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    serializers: {
      pid: () => undefined,
      name: () => undefined,
      hostname: () => undefined,
    },
    formatters: {
      log: (logContent) => {
        const store = storage.getStore()

        return {
          // Reduce nesting level otherwise stacktrace are not displayed correctly
          ...logContent,
          appName,
          requestId: store?.requestId ?? undefined,
          host: store?.hostname ?? undefined,
        }
      },
    },
    level: process.env.LOG_LEVEL ?? 'debug',
  }).child({})
}

export const logger = createLogger({
  appName: 'evently',
  storage: AppAsyncStorage.asyncLocalStorage,
})
