import { and, asc, count, desc, eq, inArray, sql, SQL } from 'drizzle-orm'
import { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js/session'
import {
  getTableConfig,
  PgInsertBase,
  PgInsertOnConflictDoUpdateConfig,
  PgTableWithColumns,
} from 'drizzle-orm/pg-core'
import { AppError } from 'src/libs/errors/AppError'
import { PostgresORM, getOrm } from '../PostgresPool'
import assert from 'node:assert'

export type OnConflictOptions<TTable extends PgTableWithColumns<any>> = {
  onConflictUpdate?: PgInsertOnConflictDoUpdateConfig<
    PgInsertBase<
      TTable,
      PostgresJsQueryResultHKT,
      undefined,
      undefined,
      false,
      never
    >
  >
}

export class Repository<
  TTable extends PgTableWithColumns<any>,
  TEntity extends TTable['$inferSelect'] = TTable['$inferSelect'],
  TEntityCreate extends TTable['$inferInsert'] = TTable['$inferInsert'],
> {
  protected table: TTable
  protected _columns: { [K in keyof TTable]: TTable[K] } | null = null
  protected _entityName: string = ''
  protected _schemaName: string = ''

  protected get entityName(): string {
    if (!this._entityName) {
      this._entityName = getTableConfig(this.table).name
    }

    return this._entityName
  }

  protected get schemaName(): string {
    if (!this._schemaName) {
      this._schemaName = getTableConfig(this.table).schema ?? 'base'
    }

    return this._schemaName
  }

  protected get columns(): { [K in keyof TTable]: TTable[K] } {
    if (!this._columns) {
      // Normally we should use the documented "getTableConfig(this.table).columns"
      // function but the returned object doesn't allow to map PostgreSQL column
      // names to entity properties names. =(
      // @ts-expect-error Symbol cannot be used as index type
      this._columns = this.table[Symbol.for('drizzle:Columns')]

      assert(this._columns)
    }

    return this._columns
  }

  constructor(table: TTable) {
    this.table = table
  }

  protected get client(): PostgresORM {
    return getOrm()
  }

  /**
   * Creates a new entity.
   *
   * @param values
   * @param [options] - Configuration options
   * @param [options.onConflictUpdate] - Configuration for handling conflicts during insert
   * @param [options.onConflictUpdate.target] - Array of columns to check for conflicts
   * @param [options.onConflictUpdate.set] - Object containing the values to set when a conflict occurs
   * @param [options.onConflictUpdate.setWhere] - SQL condition that must be true for the update to be performed
   * @param options.onConflictUpdate.targetWhere - Additional SQL condition to determine if there is a conflict
   * @returns The created entities
   *
   * @example
   * ```ts
   * await repository.createMany([
   *   { id: '1', name: 'John' },
   *   { id: '2', name: 'Jane' }
   * ])
   *
   * await repository.createMany([
   *   { id: '1', name: 'John Doe' }
   * ], {
   *   onConflictUpdate: {
   *     target: [ UserTable.name ],        // The fields to check for conflicts
   *     set: { name: 'John Doe' },         // The values to set if there is a conflict
   *     setWhere: sql`name <> "Jane Doe"`, // The condition to check for updates
   *     targetWhere: sql`id = 1`           // Additional condition to check for conflicts
   *   }
   * })
   * ```
   *
   * @see https://orm.drizzle.team/docs/insert#upserts-and-conflicts
   */
  async create(
    values: TEntityCreate,
    options?: OnConflictOptions<TTable>
  ): Promise<TEntity> {
    let result: TEntity[]

    try {
      const query = this.client.insert(this.table).values(values).returning()

      if (options?.onConflictUpdate) {
        query.onConflictDoUpdate(options.onConflictUpdate)
      }

      result = (await query.execute()) as unknown as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.creation_failed',
        status: 500,
        message: `${this.entityName} creation failed: ${error.message} ${technicalMessage}`,
        context: { ...values },
        error,
      })
    }

    if (result.length === 0) {
      throw new AppError({
        message: `${this.entityName} creation failed: unknown error`,
        code: 'repository.creation_failed',
        status: 500,
        context: { ...values },
      })
    }

    return result[0] as TEntity
  }

  /**
   * Creates new entities if they do not exist, otherwise does nothing.
   *
   * @param values
   */
  async createIfNotExists<T extends TEntityCreate | TEntityCreate[]>(
    values: T
  ): Promise<void> {
    if (Array.isArray(values) && values.length === 0) {
      return
    }

    try {
      await this.client
        .insert(this.table)
        .values(values)
        .onConflictDoNothing()
        .execute()
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.creation_failed',
        status: 500,
        message: `${this.entityName} creation failed: ${error.message} ${technicalMessage}`,
        context: { values },
        error,
      })
    }
  }

  /**
   * Creates many new entities.
   *
   * @param valuesArray - The values of the entities to create
   * @param [options] - Configuration options
   * @param [options.onConflictUpdate] - Configuration for handling conflicts during insert
   * @param [options.onConflictUpdate.target] - Array of columns to check for conflicts
   * @param [options.onConflictUpdate.set] - Object containing the values to set when a conflict occurs
   * @param [options.onConflictUpdate.setWhere] - SQL condition that must be true for the update to be performed
   * @param options.onConflictUpdate.targetWhere - Additional SQL condition to determine if there is a conflict
   * @returns The created entities
   *
   * @example
   * ```ts
   * await repository.createMany([
   *   { id: '1', name: 'John' },
   *   { id: '2', name: 'Jane' }
   * ])
   *
   * await repository.createMany([
   *   { id: '1', name: 'John Doe' }
   * ], {
   *   onConflictUpdate: {
   *     target: [ UserTable.name ],        // The fields to check for conflicts
   *     set: { name: 'John Doe' },         // The values to set if there is a conflict
   *     setWhere: sql`name <> "Jane Doe"`, // The condition to check for updates
   *     targetWhere: sql`id = 1`           // Additional condition to check for conflicts
   *   }
   * })
   * ```
   *
   * @see https://orm.drizzle.team/docs/insert#upserts-and-conflicts
   */
  async createMany(
    valuesArray: TEntityCreate[],
    options?: OnConflictOptions<TTable>
  ): Promise<TEntity[]> {
    if (valuesArray.length === 0) {
      return []
    }

    let result: TEntity[]

    try {
      const query = this.client
        .insert(this.table)
        .values(valuesArray)
        .returning()

      if (options?.onConflictUpdate) {
        query.onConflictDoUpdate(options.onConflictUpdate)
      }

      result = (await query.execute()) as unknown as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.creation_failed',
        status: 500,
        message: `${this.entityName} creation failed: ${error.message} ${technicalMessage}`,
        context: { valuesArray },
        error,
      })
    }

    if (result.length === 0) {
      throw new AppError({
        message: `${this.entityName} creation failed: unknown error`,
        code: 'repository.creation_failed',
        status: 500,
        context: { valuesArray },
      })
    }

    return result
  }

  /**
   * Updates many entities in one query.
   *
   * @returns The updated entities
   */
  async updateMany({
    updates,
  }: {
    updates: Array<
      Omit<Partial<TEntityCreate> & { id: string }, 'updatedAt' | 'createdAt'>
    >
  }): Promise<TEntity[]> {
    if (updates.length === 0) {
      return []
    }

    const firstUpdate = updates[0]

    // Comply with typescript
    assert(firstUpdate)

    const keys = Object.keys(firstUpdate)
    const setters: SQL[] = []
    const values: SQL[] = []

    for (const key of keys) {
      if (key === 'id') {
        continue
      }

      setters.push(
        sql.raw(
          `"${this.table[key].name}" = "source"."${this.table[key].name}"`
        )
      )
    }

    for (const update of updates) {
      const castedValues = keys.map((key) =>
        this.castValue({ value: update[key], key })
      )

      values.push(
        sql.join([sql`(`, sql.join(castedValues, sql.raw(',')), sql`)`])
      )
    }

    const query: SQL = sql.join(
      [
        sql`UPDATE ${this.table} SET`,
        sql.join(setters, sql.raw(', ')),
        sql.raw(`FROM (VALUES`),
        sql.join(values, sql.raw(',')),
        sql.raw(
          // Escape SQL reserved words like "right"
          `) AS source(${keys.map((key) => '"' + this.table[key].name + '"').join(', ')})`
        ),
        sql`WHERE ${this.table.id} = "source"."id"`,
        sql`RETURNING *`,
      ],
      sql.raw(' ')
    )

    const result = (await this.client.execute(query)).rows

    return result.map((row) => this.rawToEntity(row))
  }

  /**
   * Updates an entity
   *
   * @param id
   * @param values
   *
   * @returns The updated entity
   */
  async updateById(
    id: string,
    values: Partial<TEntityCreate>
  ): Promise<TEntity> {
    let result: TEntity[]

    try {
      result = (await this.client
        .update(this.table)
        .set(values)
        .where(eq(this.table.id, id))
        .returning()
        .execute()) as unknown as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.update_failed',
        status: 500,
        message: `${this.entityName} update failed: ${error.message} ${technicalMessage}`,
        context: { id, ...values },
        error,
      })
    }

    if (result.length === 0) {
      throw new AppError({
        message: `${this.entityName} update failed: unknown error`,
        code: 'repository.update_failed',
        status: 500,
        context: { id, ...values },
      })
    }

    return result[0] as TEntity
  }

  /**
   * Deletes entities where the given condition is true.
   *
   * @param where - SQL condition to filter entities to delete. Must not be empty.
   * @returns true if any entities were deleted, false otherwise
   * @throws {AppError} If deletion fails or where condition is empty
   */
  async deleteWhere(where: SQL<unknown> | undefined): Promise<boolean> {
    if (!where) {
      throw new AppError({
        code: 'repository.deletion_failed',
        status: 500,
        message: `${this.entityName} deletion failed: empty where condition => refusing to delete the entire table content`,
      })
    }

    try {
      const result = await this.client.delete(this.table).where(where).execute()

      return (result.rowCount ?? 0) > 0
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.deletion_failed',
        status: 500,
        message: `${this.entityName} deletion failed: ${error.message} ${technicalMessage}`,
        error,
      })
    }
  }

  /**
   * Deletes entities matching the given criteria
   *
   * @example
   * ```ts
   * await repository.deleteBy({
   *   status: "inactive",
   *   type: "temporary"
   * })
   * ```
   *
   * @param criteria - An object containing at least one key-value pair where the key is a column name
   * @returns true if any entities were deleted, false otherwise
   * @throws {AppError} If deletion fails or criteria is empty
   */
  async deleteBy(criteria: Partial<TEntity>): Promise<boolean> {
    if (Object.keys(criteria).length === 0) {
      throw new AppError({
        code: 'repository.deletion_failed',
        status: 500,
        message: `${this.entityName} deletion failed: at least one criteria is required`,
        context: { criteria },
      })
    }

    try {
      const conditions = Object.entries(criteria).map(([key, value]) =>
        eq(this.table[key], value)
      )

      const result = await this.client
        .delete(this.table)
        .where(and(...conditions))
        .execute()

      return (result.rowCount ?? 0) > 0
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.deletion_failed',
        status: 500,
        message: `${this.entityName} deletion failed: ${error.message} ${technicalMessage}`,
        context: { criteria },
        error,
      })
    }
  }

  /**
   * Lists entities.
   * @param options.from - Starting offset (default: 0)
   * @param options.size - Number of items to return (default: 20)
   * @param options.order - Sort order, 'asc' or 'desc' (default: 'desc')
   */
  async list({
    from = 0,
    size = 20,
    order = 'desc',
  }: {
    from?: number
    size?: number
    order?: 'asc' | 'desc'
  } = {}): Promise<TEntity[]> {
    try {
      const sortColumn = this.table.createdAt
      const sortOrder = order === 'asc' ? asc : desc

      return (await this.client
        .select()
        .from(this.table as any)
        .orderBy(sortOrder(sortColumn))
        .offset(from)
        .limit(size)
        .execute()) as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `${this.entityName} list failed: ${error.message} ${technicalMessage}`,
        context: { from, size, order },
        error,
      })
    }
  }

  /**
   * Find a list of entities by their ids
   */
  async findByIds({ ids }: { ids: string[] }): Promise<TEntity[]> {
    try {
      return (await this.client
        .select()
        .from(this.table as any)
        .where(inArray(this.table.id, ids))
        .execute()) as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `${this.entityName} find failed: ${error.message} ${technicalMessage}`,
        context: { ids },
        error,
      })
    }
  }

  /**
   * Finds an entity
   *
   * @example
   * ```ts
   * const user = await repository.findBy({ email: "user@example.com", name: "John" })
   * ```
   *
   * @param criteria - An object containing at least one key-value pair where the key is a column name
   * @returns The found entity
   */
  async findBy(criteria: Partial<TEntity>): Promise<TEntity | null> {
    if (Object.keys(criteria).length === 0) {
      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `${this.entityName} find failed: at least one criteria is required`,
        context: { criteria },
      })
    }

    let result: TEntity[]

    try {
      const conditions = Object.entries(criteria).map(([key, value]) =>
        eq(this.table[key], value)
      )

      result = (await this.client
        .select()
        .from(this.table as any)
        .where(and(...conditions))
        .execute()) as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `${this.entityName} find failed: ${error.message} ${technicalMessage}`,
        context: { criteria },
        error,
      })
    }

    if (result.length > 1) {
      throw new AppError({
        message: `Expected single ${this.entityName} but found ${result.length} results`,
        code: 'repository.multiple_found',
        status: 500,
        context: { criteria },
      })
    }

    return result[0] ?? null
  }

  /**
   * Updates entities matching the given criteria
   *
   * @example
   * ```ts
   * await repository.updateBy(
   *   { email: "user@example.com" }, // criteria
   *   { name: "New Name" }           // values to update
   * )
   * ```
   *
   * @param criterias - An object containing at least one key-value pair where the key is a column name
   * @param values - The values to update
   * @returns The updated entities
   * @throws {AppError} If the update fails
   */
  async updateBy(
    criterias: Partial<TEntity>,
    values: Partial<TEntityCreate>
  ): Promise<TEntity[]> {
    if (Object.keys(criterias).length === 0) {
      throw new AppError({
        code: 'repository.update_failed',
        status: 500,
        message: `${this.entityName} update failed: at least one criteria is required`,
        context: { criterias, values },
      })
    }

    try {
      const conditions = Object.entries(criterias).map(([key, value]) =>
        eq(this.table[key], value)
      )

      return (await this.client
        .update(this.table)
        .set(values)
        .where(and(...conditions))
        .returning()
        .execute()) as unknown as TEntity[]
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.update_failed',
        status: 500,
        message: `${this.entityName} update failed: ${error.message} ${technicalMessage}`,
        context: { criterias, values },
        error,
      })
    }
  }

  async count() {
    try {
      const result = await this.client
        .select({ count: count() })
        // Yakafokon: fix the strong typing here
        .from(this.table as any)
        .execute()

      const firstResult = result[0]

      assert(firstResult)

      return firstResult.count
    } catch (error) {
      const technicalMessage = this.getDrizzleTechnicalMessage(error.cause)

      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `${this.entityName} count failed: ${error.message} ${technicalMessage}`,
        error,
      })
    }
  }

  /**
   * Generates a Drizzle SQL expression to cast a value to the correct type.
   *
   * @param key - The key of the value to cast
   * @param value - The value to cast
   * @returns A Drizzle SQL expression casting the provided value to the correct type
   */
  private castValue({
    key,
    value,
  }: {
    key: keyof TEntityCreate
    value: unknown
  }): SQL {
    const column = this.columns[key]
    assert(column)

    if (column.columnType === 'PgEnumColumn') {
      return sql`${value}::"${sql.raw(this.schemaName)}"."${sql.raw(column.getSQLType())}"`
    }

    return sql`${value}::${sql.raw(column.getSQLType())}`
  }

  private rawToEntity(row: Record<string, unknown>): TEntity {
    const entity: Record<string, unknown> = {}

    for (const [prop, column] of Object.entries(this.columns)) {
      // there are other types but we don't need them for now, and we need to
      // extensively test them to correctly handle them
      // unhandled types: 'array' | 'json' | 'custom' | 'buffer' | 'bigint';
      switch (column.dataType) {
        case 'number':
          entity[prop] = Number(row[column.name])
          break
        case 'boolean':
          entity[prop] = !!row[column.name]
          break
        case 'date':
          entity[prop] = new Date(row[column.name] as string)
          break
        case 'buffer':
          entity[prop] = Buffer.from(row[column.name] as string)
          break
        default:
          entity[prop] = row[column.name]
      }
    }

    return entity as TEntity
  }

  private getDrizzleTechnicalMessage(error?: Error) {
    if (!error) {
      return ''
    }

    const technicalMessage: string[] = []

    if ('file' in error) {
      technicalMessage.push(`file: ${error.file}`)
    }
    if ('routine' in error) {
      technicalMessage.push(`routine: ${error.routine}`)
    }

    return technicalMessage.join(', ')
  }
}
