import { Module } from '@nestjs/common'
import { EventsRepository } from './data/EventsRepository'
import { UserEventFavoritesRepository } from './data/UserEventFavoritesRepository'
import { EventsController } from './presentation/EventsController'
import { EventsService } from './services/EventsService'
import { UserEventFavoritesService } from './services/UserEventFavoritesService'

@Module({
  imports: [],
  controllers: [EventsController],
  providers: [EventsRepository, UserEventFavoritesRepository, EventsService, UserEventFavoritesService],
  exports: [EventsService, EventsRepository, UserEventFavoritesService, UserEventFavoritesRepository],
})
export class EventsModule {}