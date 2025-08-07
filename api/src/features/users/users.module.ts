import { Global, Module } from '@nestjs/common'
import { UsersRepository } from './data/UsersRepository'
import { CredentialsRepository } from './data/CredentialsRepository'
import { UsersController } from './presentation/UsersController'
import { UsersService } from './services/UsersService'

@Global()
@Module({
  imports: [],
  controllers: [UsersController],
  providers: [UsersRepository, CredentialsRepository, UsersService],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
