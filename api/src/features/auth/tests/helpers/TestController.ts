import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Auth } from '../../decorators/Auth'

/**
 * This controller only exists in the test environment
 * It is used to test the API
 */
@ApiTags('Test')
@Controller('test')
export class TestController {
  constructor() {}

  @ApiOperation({
    description: 'Test route requiring both user:read and user:write scopes',
  })
  @Auth({
    apiAction: 'test:permission',
  })
  @Get('/permission')
  testPermission() {
    return { result: 'OK' }
  }

  @ApiOperation({
    description: 'Test route requiring admin role only',
  })
  @Auth({
    apiAction: 'test:admin-only',
    roles: ['admin'],
  })
  @Get('/admin-only')
  testAdminOnly() {
    return { result: 'Admin access granted' }
  }

  @ApiOperation({
    description: 'Test route accessible by both admin and user roles',
  })
  @Auth({
    apiAction: 'test:user-and-admin',
    roles: ['admin', 'user'],
  })
  @Get('/user-and-admin')
  testUserAndAdmin() {
    return { result: 'User or admin access granted' }
  }
}
