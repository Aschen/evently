import { AsyncLocalStorage } from 'async_hooks'
import { Pool } from 'pg'
import type { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { drizzle } from 'drizzle-orm/node-postgres'
import type { PgTransactionConfig } from 'drizzle-orm/pg-core'
import { createDebug } from 'src/libs/observability/debug'
import { logger } from 'src/libs/observability/logger'
import { getEnv } from '../utils/env'

const logQuery = createDebug('query')

/**
 * Mask the password in a connection string for logging purposes
 */
function maskConnectionString(connectionString: string): string {
  return connectionString.replace(/:([^:@]+)@/, ':****@')
}

let pool: Pool | undefined = undefined
export function getPool() {
  if (pool) {
    return pool
  }

  if (process.env.DATABASE_URL) {
    logger.info(
      `Postgres: Connect to ${maskConnectionString(process.env.DATABASE_URL)}`
    )

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.POSTGRES_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
    })

    return pool
  }

  const user = getEnv('POSTGRES_DB_USER', 'database')
  const host = getEnv('POSTGRES_HOST', 'localhost')
  const port = getEnv('POSTGRES_PORT', '5432')
  const database = getEnv('POSTGRES_DB_NAME', 'database')
  const password = getEnv('POSTGRES_PASSWORD', 'database')
  const ssl = getEnv('POSTGRES_SSL', 'false') === 'true'

  logger.info(`Postgres: Connect to ${user}:****@${host}:${port}/${database}`)

  pool = new Pool({
    user,
    database,
    password,
    host,
    port: parseInt(port, 10),
    ssl: ssl ? { rejectUnauthorized: false } : false,
  })

  return pool
}

export type PostgresORM = Omit<NodePgDatabase, 'transaction'>

export type PoolStore = {
  client: PostgresORM
}

export const PoolStore = new AsyncLocalStorage<PoolStore>()

let orm: PostgresORM | undefined = undefined
/**
 * Get the Pool ORM instance.
 *
 * Do not use unless you know what you are doing.
 *
 * Always use repository to access the ORM instead or at least getOrm() to get the current ORM instance.
 * otherwise, you will have to manage the transaction manually.
 */
export function getPoolORM() {
  if (orm) {
    return orm
  }

  orm = drizzle(getPool(), {
    logger: {
      logQuery: (query, params) => {
        logQuery?.('%s', query, params)
      },
    },
  })

  return orm
}

/**
 * Get the current ORM instance, if it exists.
 * this might be the Pool ORM instance, or a transaction ORM instance.
 */
export function getOrm() {
  const store = PoolStore.getStore()

  if (store?.client) {
    return store.client
  }

  return getPoolORM()
}

/**
 * Start a transaction with the given callback.
 * The callback will receive the client as the first argument.
 */
export async function transaction<T>(
  callback: (client: PostgresORM) => Promise<T>,
  config?: PgTransactionConfig
) {
  const orm = (PoolStore.getStore()?.client || getOrm()) as NodePgDatabase

  // Each transaction level must use the specific client created by orm.transaction
  // so we need to update the store in the async context for any query in this nested
  // transaction.
  return orm.transaction((client) => {
    return PoolStore.run({ client }, () => {
      return callback(client)
    })
  }, config)
}

export async function closePool() {
  if (pool) {
    await pool.end()
  }
  pool = undefined
  orm = undefined
}
