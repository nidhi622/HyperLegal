import { Module, Global } from '@nestjs/common'
import { HttpClientService } from './http-client.service'
import { HttpModule } from '@nestjs/axios'

@Global()
@Module({
	imports: [HttpModule.register({})],
	providers: [HttpClientService],
	exports: [HttpClientService]
})
export class HttpClientModule { }
