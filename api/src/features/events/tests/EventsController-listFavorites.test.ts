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
import { UsersTable } from 'src/features/users/data/UsersTable'
import { CredentialsTable } from 'src/features/users/data/CredentialsTable'
import type { User } from 'src/features/users/data/UsersRepository'
import { UserEventFavoritesTable } from '../data/UserEventFavoritesTable'
import { UserEventFavoritesRepository } from '../data/UserEventFavoritesRepository'
import { EventsFavoritesListResponseDto } from '../presentation/dtos/EventsControllerDtos'

describe('EventsController.listFavorites', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let userEventFavoritesRepository: UserEventFavoritesRepository
  let adminUser: User
  let regularUser: User
  let testEvents: Event[]

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

    // Create multiple test events
    testEvents = []
    for (let i = 1; i <= 5; i++) {
      const event = await eventsRepository.create({
        name: `Test Event ${i}`,
        date: new Date(`2025-${String(i).padStart(2, '0')}-15T20:00:00Z`),
        address: `${i}23 Street`,
        city: 'Paris',
        country: 'France',
        type: 'concert',
        priceAmount: `${i * 10}.00`,
        priceCurrency: 'EUR',
        isFree: false,
        description: `Description for event ${i}`,
        imageUrl: `https://example.com/event${i}.jpg`,
      })
      testEvents.push(event)
    }
  })

  describe('GET /events/favorites', () => {
    it('should list favorite events with pagination support', async () => {
      /**
       * Business rules:
       *  - rule-favorites-list-pagination
       *  - rule-favorites-authenticated-only
       */
      // Add favorites for user (events 1, 2, 3)
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[0]!.id,
      })
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[1]!.id,
      })
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[2]!.id,
      })

      const response = await userApiClient.GET('/events/favorites', {})

      assert(response.data)
      expect(response.data).toMatchObject<EventsFavoritesListResponseDto>({
        events: expect.arrayContaining([
          expect.objectContaining({
            id: testEvents[0]!.id,
            name: testEvents[0]!.name,
            isFavorited: true,
          }),
          expect.objectContaining({
            id: testEvents[1]!.id,
            name: testEvents[1]!.name,
            isFavorited: true,
          }),
          expect.objectContaining({
            id: testEvents[2]!.id,
            name: testEvents[2]!.name,
            isFavorited: true,
          }),
        ]),
        total: 3,
      })

      // Verify all events have isFavorited: true
      response.data.events.forEach(event => {
        expect(event.isFavorited).toBe(true)
      })
    })

    it('should return empty list when user has no favorites', async () => {
      const response = await userApiClient.GET('/events/favorites', {})

      assert(response.data)
      expect(response.data).toMatchObject<EventsFavoritesListResponseDto>({
        events: [],
        total: 0,
      })
    })

    it('should support pagination parameters', async () => {
      /**
       * Business rules:
       *  - rule-favorites-list-pagination
       */
      // Add 5 favorites for user
      for (const event of testEvents) {
        await userEventFavoritesRepository.create({
          userId: regularUser.id,
          eventId: event.id,
        })
      }

      // Get page 1 (from: 0, size: 2)
      const page1Response = await userApiClient.GET('/events/favorites', {
        params: {
          query: { from: 0, size: 2 },
        },
      })

      assert(page1Response.data)
      expect(page1Response.data.events).toHaveLength(2)
      expect(page1Response.data.total).toBe(5)

      // Get page 2 (from: 2, size: 2)
      const page2Response = await userApiClient.GET('/events/favorites', {
        params: {
          query: { from: 2, size: 2 },
        },
      })

      assert(page2Response.data)
      expect(page2Response.data.events).toHaveLength(2)
      expect(page2Response.data.total).toBe(5)

      // Verify different events on each page
      const page1Ids = page1Response.data.events.map(e => e.id)
      const page2Ids = page2Response.data.events.map(e => e.id)
      expect(page1Ids).not.toEqual(expect.arrayContaining(page2Ids))
    })

    it('should return 401 for unauthenticated requests', async () => {
      /**
       * Business rules:
       *  - rule-favorites-authenticated-only
       */
      await expect(
        baseApiClient.GET('/events/favorites', {})
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should only return favorites for the authenticated user', async () => {
      /**
       * Business rules:
       *  - rule-favorites-user-isolation
       */
      // Add favorites for regular user
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[0]!.id,
      })
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[1]!.id,
      })

      // Add favorites for admin user
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: testEvents[2]!.id,
      })
      await userEventFavoritesRepository.create({
        userId: adminUser.id,
        eventId: testEvents[3]!.id,
      })

      // User should only see their favorites
      const userResponse = await userApiClient.GET('/events/favorites', {})
      assert(userResponse.data)
      expect(userResponse.data.events).toHaveLength(2)
      expect(userResponse.data.events.map(e => e.id)).toEqual(
        expect.arrayContaining([testEvents[0]!.id, testEvents[1]!.id])
      )

      // Admin should only see their favorites
      const adminResponse = await adminApiClient.GET('/events/favorites', {})
      assert(adminResponse.data)
      expect(adminResponse.data.events).toHaveLength(2)
      expect(adminResponse.data.events.map(e => e.id)).toEqual(
        expect.arrayContaining([testEvents[2]!.id, testEvents[3]!.id])
      )
    })

    it('should return favorites sorted by date added (newest first)', async () => {
      // Add favorites with delay to ensure different timestamps
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[0]!.id,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[1]!.id,
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[2]!.id,
      })

      const response = await userApiClient.GET('/events/favorites', {})

      assert(response.data)
      expect(response.data.events).toHaveLength(3)
      
      // Should be ordered by newest first (event 2, event 1, event 0)
      expect(response.data.events[0]!.id).toBe(testEvents[2]!.id)
      expect(response.data.events[1]!.id).toBe(testEvents[1]!.id)
      expect(response.data.events[2]!.id).toBe(testEvents[0]!.id)
    })

    it('should include full event details in response', async () => {
      await userEventFavoritesRepository.create({
        userId: regularUser.id,
        eventId: testEvents[0]!.id,
      })

      const response = await userApiClient.GET('/events/favorites', {})

      assert(response.data)
      expect(response.data.events).toHaveLength(1)
      
      const event = response.data.events[0]
      expect(event).toMatchObject({
        id: testEvents[0]!.id,
        name: testEvents[0]!.name,
        date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/),
        location: {
          address: testEvents[0]!.address,
          city: testEvents[0]!.city,
          country: testEvents[0]!.country,
        },
        type: testEvents[0]!.type,
        price: {
          amount: parseFloat(testEvents[0]!.priceAmount),
          currency: testEvents[0]!.priceCurrency,
          isFree: testEvents[0]!.isFree,
        },
        description: testEvents[0]!.description,
        imageUrl: testEvents[0]!.imageUrl,
        isFavorited: true,
      })
    })
  })
})