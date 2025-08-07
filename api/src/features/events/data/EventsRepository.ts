import { Repository } from 'src/libs/database/data/Repository'
import { EventsTable } from './EventsTable'
import { and, gte, ilike, or, desc, asc, sql, eq } from 'drizzle-orm'
import type { EventType } from './EventsTable'
import { AppError } from 'src/libs/errors/AppError'

export type Event = typeof EventsTable.$inferSelect
export type EventCreate = typeof EventsTable.$inferInsert

export class EventsRepository extends Repository<typeof EventsTable> {
  constructor() {
    super(EventsTable)
  }

  async listEvents({
    from = 0,
    size = 20,
    search,
    location,
    type,
    isFree,
    includeAll = false,
  }: {
    from?: number
    size?: number
    search?: string
    location?: string
    type?: EventType
    isFree?: boolean
    includeAll?: boolean
  }): Promise<{ events: Event[]; total: number }> {
    try {
      const conditions = []

      // Only show future events by default
      if (!includeAll) {
        conditions.push(gte(this.table.date, new Date()))
      }

      // Search across name and location fields
      if (search) {
        conditions.push(
          or(
            ilike(this.table.name, `%${search}%`),
            ilike(this.table.address, `%${search}%`),
            ilike(this.table.city, `%${search}%`),
            ilike(this.table.country, `%${search}%`)
          )
        )
      }

      // Location filter
      if (location) {
        conditions.push(
          or(
            ilike(this.table.address, `%${location}%`),
            ilike(this.table.city, `%${location}%`),
            ilike(this.table.country, `%${location}%`)
          )
        )
      }

      // Type filter
      if (type) {
        conditions.push(eq(this.table.type, type))
      }

      // Free/paid filter
      if (isFree !== undefined) {
        conditions.push(eq(this.table.isFree, isFree))
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined

      // Get total count
      const countResult = await this.client
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(whereClause)
      
      const totalCount = countResult[0]?.count ?? 0

      // Get paginated results
      const events = await this.client
        .select()
        .from(this.table)
        .where(whereClause)
        .orderBy(asc(this.table.date))
        .limit(size)
        .offset(from)

      return {
        events: events as Event[],
        total: Number(totalCount),
      }
    } catch (error) {
      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `Events list failed: ${error.message}`,
        error,
      })
    }
  }

  async getLocationSuggestions(
    query: string,
    limit: number = 10
  ): Promise<Array<{ address: string; city: string; country: string }>> {
    try {
      const results = await this.client
        .selectDistinct({
          address: this.table.address,
          city: this.table.city,
          country: this.table.country,
        })
        .from(this.table)
        .where(
          or(
            ilike(this.table.address, `%${query}%`),
            ilike(this.table.city, `%${query}%`),
            ilike(this.table.country, `%${query}%`)
          )
        )
        .limit(limit)

      return results
    } catch (error) {
      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `Location suggestions failed: ${error.message}`,
        error,
      })
    }
  }
}