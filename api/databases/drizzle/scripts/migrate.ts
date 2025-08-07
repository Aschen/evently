import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { getPool, getOrm } from 'src/libs/database/PostgresPool'

async function main() {
  const pool = await getPool()
  const db = await getOrm()

  try {
    await migrate(db as NodePgDatabase, {
      migrationsFolder: 'databases/drizzle/migrations',
    })
  } catch (error) {
    console.error(error)
  } finally {
    await pool.end()
  }
}

main()
