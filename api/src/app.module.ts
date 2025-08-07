import { MiddlewareConsumer, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { Request, Response, NextFunction } from 'express'
import { ServerModule } from 'src/features/server/server.module'
import { AppAsyncStorage } from 'src/libs/asyncStorage/AppAsyncStorage'
import { AuthModule } from 'src/features/auth/auth.module'
import { UsersModule } from 'src/features/users/users.module'
import { EventsModule } from 'src/features/events/events.module'
import { APP_GUARD } from '@nestjs/core'
import { EnsureAuthGuard } from 'src/libs/api/guards/EnsureAuthGuard'
import { getEnv } from 'src/libs/utils/env'

@Module({
  imports: [
    // Third-party modules
    JwtModule.register({
      global: true,
      secret: getEnv('JWT_SECRET', 'secret'),
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    EventsModule,
    ServerModule,
  ],

  providers: [{ provide: APP_GUARD, useClass: EnsureAuthGuard }],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // bind the middleware,
    consumer
      .apply((_req: Request, _res: Response, next: NextFunction) => {
        AppAsyncStorage.apiEntrypoint({
          callback: next,
        })
      })
      // and register it for all routes (in case of Fastify use '(.*)')
      .forRoutes('*')
  }
}
