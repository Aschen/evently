import { Repository } from 'src/libs/database/data/Repository'
import { UserEventFavoritesTable } from './UserEventFavoritesTable'
import { EventsTable } from './EventsTable'
import { and, eq, desc, sql, inArray } from 'drizzle-orm'
import { AppError } from 'src/libs/errors/AppError'
import type { Event } from './EventsRepository'

export type UserEventFavorite = typeof UserEventFavoritesTable.$inferSelect
export type UserEventFavoriteCreate = typeof UserEventFavoritesTable.$inferInsert

export class UserEventFavoritesRepository extends Repository<typeof UserEventFavoritesTable> {
  constructor() {
    super(UserEventFavoritesTable)
  }

  async findFavoritesByUserAndEventIds(
    userId: string,
    eventIds: string[]
  ): Promise<UserEventFavorite[]> {
    try {
      if (eventIds.length === 0) {
        return []
      }

      return await this.client
        .select()
        .from(this.table)
        .where(
          and(
            eq(this.table.userId, userId),
            inArray(this.table.eventId, eventIds)
          )
        )
    } catch (error) {
      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `Find favorites by user and event IDs failed: ${error.message}`,
        error,
        context: { userId, eventIds },
      })
    }
  }

  async listFavoriteEventsForUser(
    userId: string,
    from: number = 0,
    size: number = 20
  ): Promise<{ events: Event[]; total: number }> {
    try {
      // Get total count
      const countResult = await this.client
        .select({ count: sql<number>`count(*)` })
        .from(this.table)
        .where(eq(this.table.userId, userId))
      
      const totalCount = countResult[0]?.count ?? 0

      // Get paginated results with event details
      const results = await this.client
        .select({
          event: EventsTable,
        })
        .from(this.table)
        .innerJoin(EventsTable, eq(this.table.eventId, EventsTable.id))
        .where(eq(this.table.userId, userId))
        .orderBy(desc(this.table.createdAt))
        .limit(size)
        .offset(from)

      return {
        events: results.map(r => r.event) as Event[],
        total: Number(totalCount),
      }
    } catch (error) {
      throw new AppError({
        code: 'repository.query_failed',
        status: 500,
        message: `List favorite events for user failed: ${error.message}`,
        error,
        context: { userId, from, size },
      })
    }
  }
}