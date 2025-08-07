import { uuid, uniqueIndex, index } from 'drizzle-orm/pg-core'
import { BaseSchema } from 'src/libs/database/data/BaseSchema'
import { timestampsFields } from 'src/libs/database/helpers/table-helpers'
import { UsersTable } from 'src/features/users/data/UsersTable'
import { EventsTable } from './EventsTable'

export const UserEventFavoritesTable = BaseSchema.table(
  'user_event_favorites',
  {
    /**
     * Unique identifier for the favorite relationship
     */
    id: uuid('id').primaryKey().defaultRandom(),

    /**
     * The user who favorited the event
     */
    userId: uuid('user_id')
      .notNull()
      .references(() => UsersTable.id, { onDelete: 'cascade' }),

    /**
     * The event that was favorited
     */
    eventId: uuid('event_id')
      .notNull()
      .references(() => EventsTable.id, { onDelete: 'cascade' }),

    ...timestampsFields(),
  },
  (userEventFavorites) => [
    uniqueIndex('idx_user_event_favorites_unique').on(
      userEventFavorites.userId,
      userEventFavorites.eventId
    ),
    index('idx_user_event_favorites_user_id').on(userEventFavorites.userId),
    index('idx_user_event_favorites_event_id').on(userEventFavorites.eventId),
  ]
)

export type UserEventFavorite = typeof UserEventFavoritesTable.$inferSelect
export type UserEventFavoriteCreate = typeof UserEventFavoritesTable.$inferInsert