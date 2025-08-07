import { PgTableWithColumns } from 'drizzle-orm/pg-core'
import { PostgresORM } from '../../PostgresPool'

/**
 * Truncate the tables. (Postgres)
 *
 * It has to be done one after the other to avoid
 * dead locks.
 *
 * @example
 * ```
 * await truncateTables([UsersTable])
 * ```
 */
export async function truncateTables(
  orm: PostgresORM,
  tables: PgTableWithColumns<any>[]
) {
  if (
    process.env.DATABASE_URL?.includes('.com') ||
    process.env.POSTGRES_HOST?.includes('.com')
  ) {
    throw new Error(
      'You appear to be truncating a production database. Aborting.'
    )
  }

  for (const table of tables) {
    await orm.delete(table)
  }
}
