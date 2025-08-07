import { config as dotEnvConfig } from 'dotenv-flow'
dotEnvConfig({ default_node_env: 'development', silent: true })

import process from 'node:process'
import cookieParser from 'cookie-parser'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common/pipes'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { NestApplicationOptions } from '@nestjs/common'
import { urlencoded, json } from 'express'
import { AppModule } from './app.module'
import { AppExceptionFilter } from './libs/api/filters/AppExceptionFilter'
import { AppError } from 'src/libs/errors/AppError'
import { logger } from './libs/observability/logger'
import { LoggingInterceptor } from './libs/api/interceptors/LoggingInterceptor'
import { getPool } from './libs/database/PostgresPool'
import { getEnv } from './libs/utils/env'

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000
const ONE_MINUTE_IN_MS = 60 * 1000

export async function startApplication() {
  logger.info(`Start application (NODE_ENV=${process.env.NODE_ENV})`)

  const appOptions: NestApplicationOptions = {
    bodyParser: false,
  }

  const app = await NestFactory.create(AppModule, appOptions)

  app.use(json())
  app.use(urlencoded())

  app.use(cookieParser(getEnv('COOKIE_SECRET', 'secret')))

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    maxAge:
      process.env.NODE_ENV === 'production'
        ? TWENTY_FOUR_HOURS_IN_MS
        : ONE_MINUTE_IN_MS,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
      validationError: { target: true, value: true },
      exceptionFactory: (errors) => {
        const dtoName = errors?.at(0)?.target?.constructor?.name

        // Yakafokon: we loose the stacktrace here, it's difficult to come back to the
        // API action that caused the error
        throw new AppError({
          code: 'api.validation.incoming_failed',
          status: 400,
          message:
            `Cannot validate "${dtoName}": ` +
            errors
              .map((e) => Object.values(e.constraints ?? {}))
              .flat()
              .join(', '),
          context: { errors },
        })
      },
    })
  )

  app.useGlobalFilters(new AppExceptionFilter())

  app.useGlobalInterceptors(new LoggingInterceptor())

  // Swagger configuration.
  const config = new DocumentBuilder().addBearerAuth().build()

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [],
  })
  SwaggerModule.setup('api', app, document)

  const port = parseInt(process.env.PORT ?? '4000', 10) || 4000
  await app.listen(port)

  // Ensure the pool is initialized
  getPool()

  return app
}

if (require.main === module) {
  startApplication()
}
