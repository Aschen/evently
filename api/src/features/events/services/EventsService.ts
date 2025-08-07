import { Injectable } from '@nestjs/common'
import {
  EventsRepository,
  type Event,
  type EventCreate,
} from '../data/EventsRepository'
import type { EventType } from '../data/EventsTable'
import { AppError } from 'src/libs/errors/AppError'
import { transaction } from 'src/libs/database/PostgresPool'

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  /**
   * List events with pagination and filtering support
   *
   * Business rules:
   *  - rule-events-pagination-defaults
   *  - rule-events-search-multiple-fields
   *  - rule-events-future-only
   *  - rule-events-filter-by-free-status
   *  - rule-events-filter-combination
   */
  async list({
    from = 0,
    size = 20,
    search,
    location,
    type,
    isFree,
  }: {
    from?: number
    size?: number
    search?: string
    location?: string
    type?: EventType
    isFree?: boolean
  }) {
    // Enforce maximum size to prevent performance issues
    const limitedSize = Math.min(size, 100)

    const { events, total } = await this.eventsRepository.listEvents({
      from,
      size: limitedSize,
      search,
      location,
      type,
      isFree,
      includeAll: false, // Only show future events by default
    })

    return {
      events,
      total,
    }
  }

  /**
   * Get location suggestions for autocomplete
   *
   * Business rules:
   *  - rule-locations-autocomplete-minimum
   */
  async getLocationSuggestions(query: string, limit?: number) {
    // Enforce minimum query length
    if (query.length < 2) {
      throw new AppError({
        message: 'Query must be at least 2 characters long',
        code: 'api.validation.incoming_failed',
        status: 400,
        context: { query },
      })
    }

    // Enforce maximum limit
    const limitedSize = Math.min(limit || 10, 50)

    const suggestions = await this.eventsRepository.getLocationSuggestions(
      query,
      limitedSize
    )

    // Format suggestions with displayName
    return suggestions.map((suggestion) => ({
      displayName: `${suggestion.address}, ${suggestion.city}, ${suggestion.country}`,
      address: suggestion.address,
      city: suggestion.city,
      country: suggestion.country,
    }))
  }

  /**
   * Create a new event
   *
   * Business rules:
   *  - rule-event-types-predefined
   */
  async create(eventData: {
    name: string
    date: Date
    address: string
    city: string
    country: string
    type: EventType
    price: {
      amount: number
      currency: string
    }
    description?: string
    imageUrl?: string
  }) {
    return transaction(async () => {
      const event = await this.eventsRepository.create({
        name: eventData.name,
        date: eventData.date,
        address: eventData.address,
        city: eventData.city,
        country: eventData.country,
        type: eventData.type,
        priceAmount: eventData.price.amount.toString(),
        priceCurrency: eventData.price.currency,
        isFree: eventData.price.amount === 0,
        description: eventData.description || null,
        imageUrl: eventData.imageUrl || null,
      })

      return event
    })
  }

  /**
   * Delete an event by ID
   */
  async delete(eventId: string) {
    const event = await this.eventsRepository.findBy({ id: eventId })

    if (!event) {
      throw new AppError({
        message: `Event with id "${eventId}" not found`,
        code: 'repository.not_found',
        status: 404,
        context: { eventId },
      })
    }

    await this.eventsRepository.deleteBy({ id: eventId })
  }
}
