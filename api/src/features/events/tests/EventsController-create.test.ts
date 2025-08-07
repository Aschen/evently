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
import { EventsCreateResponseDto } from '../presentation/dtos/EventsControllerDtos'
import { UsersTable } from 'src/features/users/data/UsersTable'
import { CredentialsTable } from 'src/features/users/data/CredentialsTable'
import type { User } from 'src/features/users/data/UsersRepository'
import { foundOrThrow } from 'src/libs/database/helpers/database-helpers'

describe('EventsController.create', () => {
  let pool: PostgresORM
  let baseApiClient: ApiClient
  let adminApiClient: ApiClient
  let userApiClient: ApiClient
  let eventsRepository: EventsRepository
  let adminUser: User
  let regularUser: User

  beforeAll(async () => {
    pool = getPoolORM()
    eventsRepository = new EventsRepository()
  })

  afterAll(async () => {
    await closePool()
  })

  beforeEach(async () => {
    await truncateTables(pool, [EventsTable, CredentialsTable, UsersTable])

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
  })

  describe('POST /events', () => {
    it('should create new event successfully with all fields', async () => {
      const newEventData = {
        name: 'Summer Music Festival',
        date: '2025-07-15T19:00:00Z',
        address: '123 Festival Street',
        city: 'Paris',
        country: 'France',
        type: 'festival' as const,
        price: {
          amount: 25.50,
          currency: 'EUR',
        },
        description: 'An amazing outdoor music festival',
        imageUrl: 'https://example.com/festival.jpg',
      }

      const response = await adminApiClient.POST('/events', {
        body: newEventData,
      })

      assert(response.data)
      expect(response.data).toMatchObject<EventsCreateResponseDto>({
        event: {
          id: expect.any(String),
          name: newEventData.name,
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/),
          location: {
            address: newEventData.address,
            city: newEventData.city,
            country: newEventData.country,
          },
          type: newEventData.type,
          price: {
            amount: newEventData.price.amount,
            currency: newEventData.price.currency,
            isFree: false,
          },
          description: newEventData.description,
          imageUrl: newEventData.imageUrl,
        },
      })

      // Verify in database
      const createdEvent = await foundOrThrow(
        eventsRepository.findBy({
          name: newEventData.name,
        })
      )

      expect(createdEvent).toMatchObject<Event>({
        id: expect.any(String),
        name: newEventData.name,
        date: new Date(newEventData.date),
        address: newEventData.address,
        city: newEventData.city,
        country: newEventData.country,
        type: newEventData.type,
        priceAmount: '25.50',
        priceCurrency: newEventData.price.currency,
        isFree: false,
        description: newEventData.description,
        imageUrl: newEventData.imageUrl,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      })
    })

    it('should create event with minimal fields (no description, no imageUrl)', async () => {
      const newEventData = {
        name: 'Tech Conference',
        date: '2025-09-20T09:00:00Z',
        address: '456 Tech Avenue',
        city: 'Berlin',
        country: 'Germany',
        type: 'conference' as const,
        price: {
          amount: 0,
          currency: 'EUR',
        },
      }

      const response = await adminApiClient.POST('/events', {
        body: newEventData,
      })

      assert(response.data)
      expect(response.data.event).toMatchObject({
        name: newEventData.name,
        type: newEventData.type,
        price: {
          amount: 0,
          currency: 'EUR',
          isFree: true,
        },
        description: null,
        imageUrl: null,
      })

      // Verify in database
      const createdEvent = await foundOrThrow(
        eventsRepository.findBy({
          name: newEventData.name,
        })
      )

      expect(createdEvent.isFree).toBe(true)
      expect(createdEvent.description).toBeNull()
      expect(createdEvent.imageUrl).toBeNull()
    })

    it('should validate required fields', async () => {
      const invalidEventData = {
        // Missing required fields
        name: 'Test Event',
        // Missing: date, address, city, country, type, price
      }

      await expect(
        adminApiClient.POST('/events', {
          // @ts-expect-error Testing invalid data
          body: invalidEventData,
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should validate event type', async () => {
      const invalidEventData = {
        name: 'Test Event',
        date: '2025-07-15T19:00:00Z',
        address: '123 Street',
        city: 'Paris',
        country: 'France',
        type: 'invalid-type', // Invalid type
        price: {
          amount: 25,
          currency: 'EUR',
        },
      }

      await expect(
        adminApiClient.POST('/events', {
          // @ts-expect-error Testing invalid type
          body: invalidEventData,
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should deny access for regular users', async () => {
      const newEventData = {
        name: 'User Event',
        date: '2025-07-15T19:00:00Z',
        address: '123 Street',
        city: 'Paris',
        country: 'France',
        type: 'concert' as const,
        price: {
          amount: 25,
          currency: 'EUR',
        },
      }

      await expect(
        userApiClient.POST('/events', {
          body: newEventData,
        })
      ).rejects.toMatchObject({
        code: 'security.access_denied',
      })
    })

    it('should require authentication', async () => {
      const newEventData = {
        name: 'Test Event',
        date: '2025-07-15T19:00:00Z',
        address: '123 Street',
        city: 'Paris',
        country: 'France',
        type: 'concert' as const,
        price: {
          amount: 25,
          currency: 'EUR',
        },
      }

      await expect(
        baseApiClient.POST('/events', {
          body: newEventData,
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should create free event when price amount is 0', async () => {
      const freeEventData = {
        name: 'Free Community Event',
        date: '2025-08-01T14:00:00Z',
        address: '789 Community Center',
        city: 'London',
        country: 'UK',
        type: 'other' as const,
        price: {
          amount: 0,
          currency: 'GBP',
        },
      }

      const response = await adminApiClient.POST('/events', {
        body: freeEventData,
      })

      assert(response.data)
      expect(response.data.event.price.isFree).toBe(true)

      // Verify in database
      const createdEvent = await foundOrThrow(
        eventsRepository.findBy({
          name: freeEventData.name,
        })
      )

      expect(createdEvent.isFree).toBe(true)
      expect(createdEvent.priceAmount).toBe('0.00')
    })
  })
})