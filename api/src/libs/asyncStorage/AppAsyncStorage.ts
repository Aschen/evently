import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

export type AppAsyncStore = {
  requestId: string
}

/**
 * Singleton class to manage the async storage for the API.
 */
export class AppAsyncStorage {
  private asyncLocalStorage = new AsyncLocalStorage<AppAsyncStore>()

  private static instance: AppAsyncStorage

  static getInstance() {
    if (!this.instance) {
      this.instance = new AppAsyncStorage()
    }

    return this.instance
  }

  static get asyncLocalStorage() {
    return this.getInstance().asyncLocalStorage
  }

  static getStore() {
    return this.getInstance().asyncLocalStorage.getStore()
  }

  /**
   * This method is the entrypoint for all the API-related async operations.
   *
   * Async context always hold the requestId for tracing purpose.
   */
  static apiEntrypoint<R>({ callback }: { callback: () => R }): Promise<R> {
    const requestId = randomUUID()

    const store: AppAsyncStore = {
      requestId,
    }

    return new Promise<R>((resolve, reject) => {
      this.instance.asyncLocalStorage.run(store, async () => {
        try {
          const result = await callback()

          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    })
  }
}
