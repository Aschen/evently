import { Global, Module } from '@nestjs/common'
import { ServerController } from './ServerController'

@Global()
@Module({
  controllers: [ServerController],
})
export class ServerModule {}
