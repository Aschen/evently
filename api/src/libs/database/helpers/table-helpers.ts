import { PgEnum, PgTimestampBuilder, timestamp } from 'drizzle-orm/pg-core'

export type ConvertPGEnum<T> = T extends PgEnum<infer K> ? K[number] : never

/**
 * Builds the `createdAt` column.
 */
function buildCreatedAtColumn() {
  return timestamp('created_at', {
    withTimezone: true,
    mode: 'date',
  })
    .defaultNow()
    .notNull()
}

/**
 * Builds the `updatedAt` column.
 */
function buildUpdatedAtColumn() {
  // `updatedAt` timestamp needs to be initialized with the same value
  // as the `createdAt` timestamp (with `.defaultNow()`) otherwise it will
  // still be set at creation but by drizzle and we can have few ms of difference
  return timestamp('updated_at', {
    withTimezone: true,
    mode: 'date',
  })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
}

export type TimestampFieldsType<
  CreatedAt extends boolean = true,
  UpdatedAt extends boolean = true,
> = {
  createdAt: CreatedAt extends true
    ? ReturnType<typeof buildCreatedAtColumn>
    : never
  updatedAt: UpdatedAt extends true
    ? ReturnType<typeof buildUpdatedAtColumn>
    : never
}

/**
 * Includes the createdAt and updatedAt fields.
 */
export function timestampsFields<
  CreatedAt extends boolean = true,
  UpdatedAt extends boolean = true,
>({
  createdAt,
  updatedAt,
}: {
  createdAt?: CreatedAt
  updatedAt?: UpdatedAt
} = {}): TimestampFieldsType<CreatedAt, UpdatedAt> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Record<string, PgTimestampBuilder<any>> = {}

  if (createdAt || createdAt === undefined) {
    columns.createdAt = buildCreatedAtColumn()
  }

  if (updatedAt || createdAt === undefined) {
    columns.updatedAt = buildUpdatedAtColumn()
  }

  return columns as TimestampFieldsType<CreatedAt, UpdatedAt>
}
