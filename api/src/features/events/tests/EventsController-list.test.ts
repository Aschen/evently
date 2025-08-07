import { type ApiClient, createApiClient } from '@evently/api-client'
import assert from 'node:assert'
import {
  type PostgresORM,
  getPoolORM,
  closePool,
} from 'src/libs/database/PostgresPool'
import { type Event, EventsRepository } from '../data/EventsRepository'
import { EventsTable } from '../data/EventsTable'
import { createUser } from 'src/features/users/tests/helpers/usersFactory'
import { truncateTables } from 'src/libs/database/tests/helpers/tables'
import { EventsListResponseDto } from '../presentation/dtos/EventsControllerDtos'
import { UsersTable } from 'src/features/users/data/UsersTable'
import { CredentialsTable } from 'src/features/users/data/CredentialsTable'
import type { User } from 'src/features/users/data/UsersRepository'
import { UserEventFavoritesTable } from '../data/UserEventFavoritesTable'
import { UserEventFavoritesRepository } from '../data/UserEventFavoritesRepository'

describe('EventsController.list', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let userEventFavoritesRepository: UserEventFavoritesRepository
  let adminUser: User
  let regularUser: User
  let futureEvent1: Event
  let futureEvent2: Event
  let pastEvent: Event

  beforeAll(async () => {
    pool = getPoolORM()
    eventsRepository = new EventsRepository()
    userEventFavoritesRepository = new UserEventFavoritesRepository()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [UserEventFavoritesTable, EventsTable, CredentialsTable, UsersTable])

    baseApiClient = createApiClient({
      url: 'http://localhost:4000',
    })

    // Create admin user for testing
    adminUser = await createUser({
      email: 'admin@example.com',
      password: 'password',
      role: 'admin',
    })

    // Create regular user for testing
    regularUser = await createUser({
      email: 'user@example.com',
      password: 'password',
      role: 'user',
    })

    // Get JWT tokens for both users
    const adminLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: adminUser.email,
        password: 'password',
        returnToken: true,
      },
    })
    assert(adminLoginResponse.data)
    const adminJwt = adminLoginResponse.data.token

    const userLoginResponse = await baseApiClient.POST('/auth/login', {
      body: {
        email: regularUser.email,
        password: 'password',
        returnToken: true,
      },
    })
    assert(userLoginResponse.data)
    const userJwt = userLoginResponse.data.token

    // Create authenticated API clients
    adminApiClient = createApiClient({
      url: 'http://localhost:4000',
      token: adminJwt,
    })

    userApiClient = createApiClient({
      url: 'http://localhost:4000',
      token: userJwt,
    })

    // Create test events
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)

    const pastDate = new Date()
    pastDate.setMonth(pastDate.getMonth() - 1)

    futureEvent1 = await eventsRepository.create({
      name: 'Summer Music Festival',
      date: futureDate,
      address: '123 Main Street',
      city: 'Paris',
      country: 'France',
      type: 'festival',
      priceAmount: '25.50',
      priceCurrency: 'EUR',
      isFree: false,
      description: 'A great music festival',
      imageUrl: 'https://example.com/image1.jpg',
    })

    futureEvent2 = await eventsRepository.create({
      name: 'Tech Conference 2025',
      date: new Date(futureDate.getTime() + 86400000), // +1 day
      address: '456 Tech Avenue',
      city: 'Berlin',
      country: 'Germany',
      type: 'conference',
      priceAmount: '0',
      priceCurrency: 'EUR',
      isFree: true,
      description: 'Free tech conference',
      imageUrl: null,
    })

    pastEvent = await eventsRepository.create({
      name: 'Past Concert',
      date: pastDate,
      address: '789 Old Street',
      city: 'London',
      country: 'UK',
      type: 'concert',
      priceAmount: '50.00',
      priceCurrency: 'GBP',
      isFree: false,
      description: null,
      imageUrl: null,
    })
  })

  describe('GET /events', () => {
    it('should return list of future events with default pagination', async () => {
      const response = await userApiClient.GET('/events')

      assert(response.data)
      expect(response.data).toMatchObject<EventsListResponseDto>({
        events: expect.arrayContaining([
          expect.objectContaining({
            id: futureEvent1.id,
            name: futureEvent1.name,
            type: futureEvent1.type,
            location: {
              address: futureEvent1.address,
              city: futureEvent1.city,
              country: futureEvent1.country,
            },
            price: {
              amount: 25.5,
              currency: 'EUR',
              isFree: false,
            },
          }),
          expect.objectContaining({
            id: futureEvent2.id,
            name: futureEvent2.name,
            type: futureEvent2.type,
            location: {
              address: futureEvent2.address,
              city: futureEvent2.city,
              country: futureEvent2.country,
            },
            price: {
              amount: 0,
              currency: 'EUR',
              isFree: true,
            },
          }),
        ]),
        total: 2,
      })

      // Should not include past events
      expect(response.data.events).toHaveLength(2)
      expect(response.data.events.find(e => e.id === pastEvent.id)).toBeUndefined()
    })

    it('should support pagination with custom from and size parameters', async () => {
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            from: 0,
            size: 1,
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.total).toBe(2)
    })

    it('should search across event names', async () => {
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            search: 'Music',
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.events[0]!.name).toBe('Summer Music Festival')
    })

    it('should filter by location text', async () => {
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            location: 'Paris',
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.events[0]!.location.city).toBe('Paris')
    })

    it('should filter by event type', async () => {
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            type: 'conference',
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.events[0]!.type).toBe('conference')
    })

    it('should support combined filters', async () => {
      // Add another conference in Berlin
      await eventsRepository.create({
        name: 'Another Tech Conference',
        date: new Date(Date.now() + 86400000),
        address: '999 Tech Street',
        city: 'Berlin',
        country: 'Germany',
        type: 'conference',
        priceAmount: '100',
        priceCurrency: 'EUR',
        isFree: false,
      })

      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            search: 'Tech',
            type: 'conference',
            location: 'Berlin',
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(2)
      expect(response.data.events.every(e => e.type === 'conference')).toBe(true)
      expect(response.data.events.every(e => e.location.city === 'Berlin')).toBe(true)
    })

    it('should handle invalid type parameter', async () => {
      await expect(
        userApiClient.GET('/events', {
          params: {
            query: {
              // @ts-expect-error Testing invalid type
              type: 'invalid-type',
            },
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should allow public access without authentication', async () => {
      const response = await baseApiClient.GET('/events')
      
      assert(response.data)
      expect(response.data.events).toBeDefined()
      expect(response.data.total).toBeDefined()
      
      // Events should have isFavorited set to false for anonymous users
      response.data.events.forEach(event => {
        expect(event.isFavorited).toBe(false)
      })
    })

    it('should allow access for admin users', async () => {
      const response = await adminApiClient.GET('/events')

      assert(response.data)
      expect(response.data.events).toBeDefined()
      expect(response.data.total).toBeDefined()
    })

    it('should allow access for regular users', async () => {
      const response = await userApiClient.GET('/events')

      assert(response.data)
      expect(response.data.events).toBeDefined()
      expect(response.data.total).toBeDefined()
    })

    it('should filter for free events only when isFree=true', async () => {
      /**
       * Business rules:
       *  - rule-events-filter-by-free-status
       */
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            isFree: true,
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.total).toBe(1)
      expect(response.data.events[0]!.id).toBe(futureEvent2.id)
      expect(response.data.events[0]!.price.amount).toBe(0)
      expect(response.data.events[0]!.price.isFree).toBe(true)
    })

    it('should filter for paid events only when isFree=false', async () => {
      /**
       * Business rules:
       *  - rule-events-filter-by-free-status
       */
      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            isFree: false,
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      expect(response.data.total).toBe(1)
      expect(response.data.events[0]!.id).toBe(futureEvent1.id)
      expect(response.data.events[0]!.price.amount).toBeGreaterThan(0)
      expect(response.data.events[0]!.price.isFree).toBe(false)
    })

    it('should return all events when isFree is not provided', async () => {
      /**
       * Business rules:
       *  - rule-events-filter-by-free-status
       */
      const response = await userApiClient.GET('/events')

      assert(response.data)
      expect(response.data.events).toHaveLength(2)
      expect(response.data.total).toBe(2)
      
      const freeEvents = response.data.events.filter(e => e.price.isFree)
      const paidEvents = response.data.events.filter(e => !e.price.isFree)
      
      expect(freeEvents).toHaveLength(1)
      expect(paidEvents).toHaveLength(1)
    })

    it('should combine isFree filter with other filters', async () => {
      /**
       * Business rules:
       *  - rule-events-filter-by-free-status
       *  - rule-events-filter-combination
       */
      // Create more events for comprehensive testing
      await eventsRepository.create({
        name: 'Free Music Workshop',
        date: new Date(Date.now() + 86400000),
        address: '123 Music Street',
        city: 'Paris',
        country: 'France',
        type: 'other',
        priceAmount: '0',
        priceCurrency: 'EUR',
        isFree: true,
      })

      await eventsRepository.create({
        name: 'Paid Music Concert',
        date: new Date(Date.now() + 86400000),
        city: 'Paris',
        address: '456 Concert Hall',
        country: 'France',
        type: 'concert',
        priceAmount: '75',
        priceCurrency: 'EUR',
        isFree: false,
      })

      // Test: Free events in Paris
      const response1 = await userApiClient.GET('/events', {
        params: {
          query: {
            isFree: true,
            location: 'Paris',
          },
        },
      })

      assert(response1.data)
      expect(response1.data.events).toHaveLength(1)
      expect(response1.data.events[0]!.price.isFree).toBe(true)
      expect(response1.data.events[0]!.location.city).toBe('Paris')

      // Test: Paid events with search term "Music"
      const response2 = await userApiClient.GET('/events', {
        params: {
          query: {
            isFree: false,
            search: 'Music',
          },
        },
      })

      assert(response2.data)
      expect(response2.data.events).toHaveLength(2)
      expect(response2.data.events.every(e => !e.price.isFree)).toBe(true)
      expect(response2.data.events.every(e => e.name.includes('Music'))).toBe(true)
    })

    it('should apply isFree filter before pagination', async () => {
      /**
       * Business rules:
       *  - rule-events-filter-by-free-status
       *  - rule-events-filter-pagination
       */
      // Create multiple free events
      for (let i = 0; i < 5; i++) {
        await eventsRepository.create({
          name: `Free Event ${i}`,
          date: new Date(Date.now() + 86400000 * (i + 1)),
          address: `${i} Free Street`,
          city: 'TestCity',
          country: 'TestCountry',
          type: 'other',
          priceAmount: '0',
          priceCurrency: 'EUR',
          isFree: true,
        })
      }

      const response = await userApiClient.GET('/events', {
        params: {
          query: {
            isFree: true,
            from: 0,
            size: 3,
          },
        },
      })

      assert(response.data)
      expect(response.data.events).toHaveLength(3)
      expect(response.data.total).toBe(6) // 1 existing free event + 5 new ones
      expect(response.data.events.every(e => e.price.isFree)).toBe(true)
    })

    it('should handle invalid boolean values for isFree parameter', async () => {
      await expect(
        userApiClient.GET('/events', {
          params: {
            query: {
              // @ts-expect-error Testing invalid boolean value
              isFree: 'invalid',
            },
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should handle string boolean values correctly', async () => {
      // Test with string "true"
      const responseTrueString = await userApiClient.GET('/events', {
        params: {
          query: {
            // @ts-expect-error Testing string value that should be transformed
            isFree: 'true',
          },
        },
      })

      assert(responseTrueString.data)
      expect(responseTrueString.data.events.every(e => e.price.isFree)).toBe(true)

      // Test with string "false"
      const responseFalseString = await userApiClient.GET('/events', {
        params: {
          query: {
            // @ts-expect-error Testing string value that should be transformed
            isFree: 'false',
          },
        },
      })

      assert(responseFalseString.data)
      expect(responseFalseString.data.events.every(e => !e.price.isFree)).toBe(true)
    })

    it('should include isFavorited flag for authenticated users', async () => {
      // Add futureEvent1 to user's favorites
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: futureEvent1.id,
      })

      // Get events as authenticated user
      const authResponse = await userApiClient.GET('/events')
      
      assert(authResponse.data)
      expect(authResponse.data.events).toHaveLength(2)
      
      // Find the favorited and non-favorited events
      const favoritedEvent = authResponse.data.events.find(e => e.id === futureEvent1.id)
      const nonFavoritedEvent = authResponse.data.events.find(e => e.id === futureEvent2.id)
      
      expect(favoritedEvent).toBeDefined()
      expect(favoritedEvent!.isFavorited).toBe(true)
      
      expect(nonFavoritedEvent).toBeDefined()
      expect(nonFavoritedEvent!.isFavorited).toBe(false)
    })

    it('should set isFavorited to false for anonymous users', async () => {
      // Add some favorites (they should not affect anonymous users)
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: futureEvent1.id,
      })

      // The list endpoint is now public, so we can test without authentication
      const anonResponse = await baseApiClient.GET('/events')
      
      assert(anonResponse.data)
      expect(anonResponse.data.events).toHaveLength(2)
      
      // All events should have isFavorited set to false for anonymous users
      anonResponse.data.events.forEach(event => {
        expect(event.isFavorited).toBe(false)
      })
    })

    it('should show correct isFavorited flags for different users', async () => {
      // Regular user favorites futureEvent1
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: futureEvent1.id,
      })

      // Admin user favorites futureEvent2
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: futureEvent2.id,
      })

      // Check regular user's view
      const userResponse = await userApiClient.GET('/events')
      assert(userResponse.data)
      
      const userEvent1 = userResponse.data.events.find(e => e.id === futureEvent1.id)
      const userEvent2 = userResponse.data.events.find(e => e.id === futureEvent2.id)
      
      expect(userEvent1!.isFavorited).toBe(true)  // User favorited this
      expect(userEvent2!.isFavorited).toBe(false) // User didn't favorite this
      
      // Check admin user's view
      const adminResponse = await adminApiClient.GET('/events')
      assert(adminResponse.data)
      
      const adminEvent1 = adminResponse.data.events.find(e => e.id === futureEvent1.id)
      const adminEvent2 = adminResponse.data.events.find(e => e.id === futureEvent2.id)
      
      expect(adminEvent1!.isFavorited).toBe(false) // Admin didn't favorite this
      expect(adminEvent2!.isFavorited).toBe(true)  // Admin favorited this
    })
  })
})