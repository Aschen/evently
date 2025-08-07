import { Injectable } from '@nestjs/common'
import {
  UserEventFavoritesRepository,
  type UserEventFavorite,
} from '../data/UserEventFavoritesRepository'
import {
  EventsRepository,
  type Event,
} from '../data/EventsRepository'
import { AppError } from 'src/libs/errors/AppError'
import { transaction } from 'src/libs/database/PostgresPool'

@Injectable()
export class UserEventFavoritesService {
  constructor(
    private readonly userEventFavoritesRepository: UserEventFavoritesRepository,
    private readonly eventsRepository: EventsRepository
  ) {}

  /**
   * Add an event to user's favorites
   *
   * Business rules:
   *  - rule-favorites-idempotent-operations
   *  - rule-favorites-valid-event
   */
  async addFavorite(userId: string, eventId: string): Promise<void> {
    return transaction(async () => {
      // Check if event exists
      const event = await this.eventsRepository.findBy({ id: eventId })
      if (!event) {
        throw new AppError({
          message: `Event with id "${eventId}" not found`,
          code: 'repository.not_found',
          status: 404,
          context: { eventId },
        })
      }

      // Check if favorite already exists (idempotent operation)
      const existingFavorite = await this.userEventFavoritesRepository.findBy({
        userId,
        eventId,
      })

      if (!existingFavorite) {
        await this.userEventFavoritesRepository.create({
          userId,
          eventId,
        })
      }
    })
  }

  /**
   * Remove an event from user's favorites
   *
   * Business rules:
   *  - rule-favorites-idempotent-operations
   */
  async removeFavorite(userId: string, eventId: string): Promise<void> {
    // Idempotent operation - no error if favorite doesn't exist
    await this.userEventFavoritesRepository.deleteBy({
      userId,
      eventId,
    })
  }

  /**
   * List user's favorite events with pagination
   *
   * Business rules:
   *  - rule-favorites-list-pagination
   */
  async listUserFavorites(
    userId: string,
    from: number = 0,
    size: number = 20
  ): Promise<{ events: Event[]; total: number }> {
    // Enforce maximum size to prevent performance issues
    const limitedSize = Math.min(size, 100)

    const result = await this.userEventFavoritesRepository.listFavoriteEventsForUser(
      userId,
      from,
      limitedSize
    )

    return result
  }

  /**
   * Check if a specific event is favorited by a user
   */
  async isEventFavoritedByUser(
    userId: string,
    eventId: string
  ): Promise<boolean> {
    const favorite = await this.userEventFavoritesRepository.findBy({
      userId,
      eventId,
    })

    return !!favorite
  }

  /**
   * Add isFavorited flag to a list of events
   */
  async addIsFavoritedFlag(
    events: Event[],
    userId: string | null
  ): Promise<Array<Event & { isFavorited?: boolean }>> {
    if (!userId || events.length === 0) {
      return events.map(event => ({ ...event, isFavorited: false }))
    }

    const eventIds = events.map(event => event.id)
    const favorites = await this.userEventFavoritesRepository.findFavoritesByUserAndEventIds(
      userId,
      eventIds
    )

    const favoriteEventIds = new Set(favorites.map(fav => fav.eventId))

    return events.map(event => ({
      ...event,
      isFavorited: favoriteEventIds.has(event.id),
    }))
  }
}