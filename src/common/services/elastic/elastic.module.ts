import { forwardRef, Global, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { ElrondElasticService } from '../elrond-communication';

@Global()
@Module({
  imports: [forwardRef(() => CommonModule)],
  providers: [ElrondElasticService],
  exports: [ElrondElasticService],
})
export class ElasticModule {}
