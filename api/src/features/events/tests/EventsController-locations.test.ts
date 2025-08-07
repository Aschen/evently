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
import { EventsLocationsResponseDto } from '../presentation/dtos/EventsControllerDtos'
import { UsersTable } from 'src/features/users/data/UsersTable'
import { CredentialsTable } from 'src/features/users/data/CredentialsTable'
import type { User } from 'src/features/users/data/UsersRepository'

describe('EventsController.locations', () => {
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

    // Create test events with various locations
    const futureDate = new Date()
    futureDate.setMonth(futureDate.getMonth() + 1)

    await eventsRepository.create({
      name: 'Event 1',
      date: futureDate,
      address: '123 Main Street',
      city: 'Paris',
      country: 'France',
      type: 'concert',
      priceAmount: '25.50',
      priceCurrency: 'EUR',
      isFree: false,
    })

    await eventsRepository.create({
      name: 'Event 2',
      date: futureDate,
      address: '456 Champs-Élysées',
      city: 'Paris',
      country: 'France',
      type: 'festival',
      priceAmount: '0',
      priceCurrency: 'EUR',
      isFree: true,
    })

    await eventsRepository.create({
      name: 'Event 3',
      date: futureDate,
      address: '789 Oxford Street',
      city: 'London',
      country: 'UK',
      type: 'conference',
      priceAmount: '100',
      priceCurrency: 'GBP',
      isFree: false,
    })

    await eventsRepository.create({
      name: 'Event 4',
      date: futureDate,
      address: '321 Park Avenue',
      city: 'New York',
      country: 'USA',
      type: 'sport',
      priceAmount: '75',
      priceCurrency: 'USD',
      isFree: false,
    })
  })

  describe('GET /events/locations', () => {
    it('should return location suggestions with valid query', async () => {
      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'Par',
          },
        },
      })

      assert(response.data)
      expect(response.data).toMatchObject<EventsLocationsResponseDto>({
        suggestions: expect.arrayContaining([
          {
            displayName: '123 Main Street, Paris, France',
            address: '123 Main Street',
            city: 'Paris',
            country: 'France',
          },
          {
            displayName: '456 Champs-Élysées, Paris, France',
            address: '456 Champs-Élysées',
            city: 'Paris',
            country: 'France',
          },
          {
            displayName: '321 Park Avenue, New York, USA',
            address: '321 Park Avenue',
            city: 'New York',
            country: 'USA',
          },
        ]),
      })
    })

    it('should enforce minimum query length of 2 characters', async () => {
      await expect(
        userApiClient.GET('/events/locations', {
          params: {
            query: {
              query: 'P',
            },
          },
        })
      ).rejects.toMatchObject({
        code: 'api.validation.incoming_failed',
      })
    })

    it('should support custom limit parameter', async () => {
      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'Par',
            limit: 2,
          },
        },
      })

      assert(response.data)
      expect(response.data.suggestions).toHaveLength(2)
    })

    it('should perform case-insensitive search', async () => {
      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'LONDON',
          },
        },
      })

      assert(response.data)
      expect(response.data.suggestions).toHaveLength(1)
      expect(response.data.suggestions[0]!.city).toBe('London')
    })

    it('should return empty results for non-matching query', async () => {
      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'NonExistentCity',
          },
        },
      })

      assert(response.data)
      expect(response.data.suggestions).toHaveLength(0)
    })

    it('should search across address, city, and country fields', async () => {
      // Search by country
      const countryResponse = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'USA',
          },
        },
      })

      assert(countryResponse.data)
      expect(countryResponse.data.suggestions).toHaveLength(1)
      expect(countryResponse.data.suggestions[0]!.country).toBe('USA')

      // Search by street name
      const streetResponse = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'Oxford',
          },
        },
      })

      assert(streetResponse.data)
      expect(streetResponse.data.suggestions).toHaveLength(1)
      expect(streetResponse.data.suggestions[0]!.address).toBe('789 Oxford Street')
    })

    it('should return unique location combinations', async () => {
      // Add duplicate location
      await eventsRepository.create({
        name: 'Duplicate Event',
        date: new Date(),
        address: '123 Main Street',
        city: 'Paris',
        country: 'France',
        type: 'other',
        priceAmount: '0',
        priceCurrency: 'EUR',
        isFree: true,
      })

      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: '123 Main',
          },
        },
      })

      assert(response.data)
      // Should only return one suggestion for the duplicate location
      expect(response.data.suggestions).toHaveLength(1)
      expect(response.data.suggestions[0]!.address).toBe('123 Main Street')
    })

    it('should require authentication', async () => {
      await expect(
        baseApiClient.GET('/events/locations', {
          params: {
            query: {
              query: 'Paris',
            },
          },
        })
      ).rejects.toMatchObject({
        code: 'security.missing_token',
      })
    })

    it('should allow access for admin users', async () => {
      const response = await adminApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'Paris',
          },
        },
      })

      assert(response.data)
      expect(response.data.suggestions).toBeDefined()
    })

    it('should allow access for regular users', async () => {
      const response = await userApiClient.GET('/events/locations', {
        params: {
          query: {
            query: 'Paris',
          },
        },
      })

      assert(response.data)
      expect(response.data.suggestions).toBeDefined()
    })
  })
})