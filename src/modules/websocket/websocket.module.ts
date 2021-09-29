import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';

import { WebSocketService } from './websocket.service';

@Module({
  imports: [CommonModule],
  providers: [WebSocketService],
  exports: [],
})
export class WebSocketModule {}
