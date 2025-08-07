import 'dotenv/config'
import type { Config } from 'drizzle-kit'

export default {
  dialect: 'postgresql',
  schema: './src/**/*Table.ts',
  out: './databases/drizzle/migrations',
  strict: true,
  verbose: true,
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      `postgres://${process.env.POSTGRES_DB_USER}:${
        process.env.POSTGRES_DB_USER_PASSWORD
      }@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT ?? 5432}/${
        process.env.POSTGRES_DB_NAME
      }`,
  },
} satisfies Config
