import { Global, Module } from '@nestjs/common'
import { AuthController } from './presentation/AuthController'
import { AuthService } from './services/AuthService'
import { RolesGuard } from './guards/RolesGuard'
import { TestController } from './tests/helpers/TestController'
import { UsersModule } from '../users/users.module'

@Global()
@Module({
  imports: [UsersModule],
  providers: [AuthService, RolesGuard],
  exports: [AuthService, RolesGuard],
  controllers: [
    AuthController,
    // Used to test the API permissions
    ...(process.env.NODE_ENV === 'test' ? [TestController] : []),
  ],
})
export class AuthModule {}
