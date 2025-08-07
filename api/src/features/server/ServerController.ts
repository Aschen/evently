import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { HealthCheckResponseDto } from './presentation/dtos/ServerControllerDtos'
import { getPool } from 'src/libs/database/PostgresPool'
import { PublicApi } from 'src/libs/api/decorators/PublicApi'
import { AppError } from 'src/libs/errors/AppError'

@ApiTags('Server')
@Controller('server')
export class ServerController {
  constructor() {}

  @ApiOperation({
    description: 'Health check',
  })
  @ApiResponse({
    status: 200,
    description: 'All services are healthy',
    type: HealthCheckResponseDto,
  })
  @ApiResponse({
    status: 503,
    description: 'One or more services are unhealthy',
  })
  @PublicApi()
  @Get('/health-check')
  async healthCheck(): Promise<HealthCheckResponseDto> {
    const status: HealthCheckResponseDto = {
      status: 'healthy',
      services: {
        postgres: { status: 'unknown' },
      },
    }

    try {
      const pgStart = Date.now()
      const pool = getPool()
      await pool.query('SELECT 1')
      const pgLatency = Date.now() - pgStart
      status.services.postgres = { status: 'healthy', latency: pgLatency }
    } catch (error) {
      status.status = 'unhealthy'
      status.services.postgres = {
        status: 'unhealthy',
        error: error.message,
        details: 'Failed to connect to Postgres database',
      }
    }

    if (status.status === 'unhealthy') {
      const unhealthyServices = Object.entries(status.services)
        .filter(([_, service]) => service.status === 'unhealthy')
        .map(([name, service]) => `${name}: ${service.details}`)
        .join('; ')

      throw new AppError({
        code: 'api.service_unavailable',
        status: 503,
        message: `Service check failed - ${unhealthyServices}`,
        context: { status },
      })
    }

    return status
  }
}
