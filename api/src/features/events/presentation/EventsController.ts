import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  HttpCode,
} from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiValidatedResponse } from 'src/libs/api/decorators/ApiValidatedResponse'
import { Auth } from 'src/features/auth/decorators/Auth'
import { UserId } from 'src/features/auth/decorators/UserId'
import { VerifyJWT } from 'src/features/auth/decorators/VerifyJWT'
import { PublicApi } from 'src/libs/api/decorators/PublicApi'
import { EventsService } from '../services/EventsService'
import { UserEventFavoritesService } from '../services/UserEventFavoritesService'
import { EventsRepository } from '../data/EventsRepository'
import { AppError } from 'src/libs/errors/AppError'
import {
  EventsListParamsDto,
  EventsListResponseDto,
  EventsLocationsParamsDto,
  EventsLocationsResponseDto,
  EventsCreateParamsDto,
  EventsCreateResponseDto,
  EventsFavoritesListResponseDto,
  EventFavoriteGetResponseDto,
} from './dtos/EventsControllerDtos'
import { EventDto } from './dtos/EventDto'
import type { Event } from '../data/EventsRepository'

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly userEventFavoritesService: UserEventFavoritesService,
    private readonly eventsRepository: EventsRepository
  ) {}

  @Get('')
  @ApiOperation({
    description: 'List events with pagination and filtering support',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'List of events with total count',
    type: EventsListResponseDto,
  })
  @PublicApi()
  @VerifyJWT()
  async list(
    @Query() query: EventsListParamsDto,
    @UserId({ allowAnonymous: true }) userId?: string
  ): Promise<EventsListResponseDto> {
    const { events, total } = await this.eventsService.list({
      from: query.from,
      size: query.size,
      search: query.search,
      location: query.location,
      type: query.type,
      isFree: query.isFree,
    })

    // Add isFavorited flag for authenticated users
    const eventsWithFavorites = await this.userEventFavoritesService.addIsFavoritedFlag(
      events,
      userId || null
    )

    return {
      events: eventsWithFavorites.map((event) => this.mapEventToDto(event)),
      total,
    }
  }

  @Get('favorites')
  @ApiOperation({
    description: 'List all favorite events for the current user with pagination support',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'List of favorite events with total count',
    type: EventsFavoritesListResponseDto,
  })
  @Auth({
    apiAction: 'events:favorites:list',
    roles: ['admin', 'user'],
  })
  async listFavorites(
    @Query() query: EventsListParamsDto,
    @UserId() userId: string
  ): Promise<EventsFavoritesListResponseDto> {
    const { events, total } = await this.userEventFavoritesService.listUserFavorites(
      userId,
      query.from || 0,
      query.size || 20
    )

    // All events in favorites are favorited
    const eventsWithFavorites = events.map(event => ({ ...event, isFavorited: true }))

    return {
      events: eventsWithFavorites.map((event) => this.mapEventToDto(event)),
      total,
    }
  }

  @Get('locations')
  @ApiOperation({
    description: 'Get location suggestions for autocomplete',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'List of location suggestions',
    type: EventsLocationsResponseDto,
  })
  @Auth({
    apiAction: 'events:locations',
    roles: ['admin', 'user'],
  })
  async locations(
    @Query() query: EventsLocationsParamsDto
  ): Promise<EventsLocationsResponseDto> {
    const suggestions = await this.eventsService.getLocationSuggestions(
      query.query,
      query.limit
    )

    return { suggestions }
  }

  @Post('')
  @ApiOperation({
    description: 'Create a new event (Admin only)',
  })
  @ApiValidatedResponse({
    status: 201,
    description: 'Event created successfully',
    type: EventsCreateResponseDto,
  })
  @Auth({
    apiAction: 'events:create',
    roles: ['admin'],
  })
  async create(
    @Body() body: EventsCreateParamsDto
  ): Promise<EventsCreateResponseDto> {
    const event = await this.eventsService.create({
      name: body.name,
      date: new Date(body.date),
      address: body.address,
      city: body.city,
      country: body.country,
      type: body.type,
      price: body.price,
      description: body.description,
      imageUrl: body.imageUrl,
    })

    return {
      event: this.mapEventToDto(event),
    }
  }

  @Get(':id/favorite')
  @ApiOperation({
    description: 'Get details of a single favorite event by ID',
  })
  @ApiValidatedResponse({
    status: 200,
    description: 'Event details',
    type: EventFavoriteGetResponseDto,
  })
  @Auth({
    apiAction: 'events:favorites:get',
    roles: ['admin', 'user'],
  })
  async getFavorite(
    @Param('id') eventId: string,
    @UserId() userId: string
  ): Promise<EventFavoriteGetResponseDto> {
    // Check if event is favorited by user
    const isFavorited = await this.userEventFavoritesService.isEventFavoritedByUser(
      userId,
      eventId
    )

    if (!isFavorited) {
      throw new AppError({
        message: `Event with id "${eventId}" is not in your favorites`,
        code: 'repository.not_found',
        status: 404,
        context: { eventId },
      })
    }

    // Get event details
    const event = await this.eventsRepository.findBy({ id: eventId })
    if (!event) {
      throw new AppError({
        message: `Event with id "${eventId}" not found`,
        code: 'repository.not_found',
        status: 404,
        context: { eventId },
      })
    }

    return {
      event: this.mapEventToDto({ ...event, isFavorited: true }),
    }
  }

  @Post(':id/favorites')
  @HttpCode(201)
  @ApiOperation({
    description: 'Add an event to the current user\'s favorites list',
  })
  @ApiValidatedResponse({
    status: 201,
    description: 'Event added to favorites',
  })
  @Auth({
    apiAction: 'events:favorites:add',
    roles: ['admin', 'user'],
  })
  async addToFavorites(
    @Param('id') eventId: string,
    @UserId() userId: string
  ): Promise<void> {
    await this.userEventFavoritesService.addFavorite(userId, eventId)
  }

  @Delete(':id/favorites')
  @HttpCode(204)
  @ApiOperation({
    description: 'Remove an event from the current user\'s favorites list',
  })
  @ApiValidatedResponse({
    status: 204,
    description: 'Event removed from favorites',
  })
  @Auth({
    apiAction: 'events:favorites:remove',
    roles: ['admin', 'user'],
  })
  async removeFromFavorites(
    @Param('id') eventId: string,
    @UserId() userId: string
  ): Promise<void> {
    await this.userEventFavoritesService.removeFavorite(userId, eventId)
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    description: 'Delete an event (Admin only)',
  })
  @ApiValidatedResponse({
    status: 204,
    description: 'Event deleted successfully',
  })
  @Auth({
    apiAction: 'events:delete',
    roles: ['admin'],
  })
  async delete(@Param('id') eventId: string): Promise<void> {
    await this.eventsService.delete(eventId)
  }

  private mapEventToDto(event: Event & { isFavorited?: boolean }): EventDto {
    return {
      id: event.id,
      name: event.name,
      date: event.date.toISOString(),
      location: {
        address: event.address,
        city: event.city,
        country: event.country,
      },
      type: event.type,
      price: {
        amount: parseFloat(event.priceAmount),
        currency: event.priceCurrency,
        isFree: event.isFree,
      },
      description: event.description,
      imageUrl: event.imageUrl,
      isFavorited: event.isFavorited,
    }
  }
}
