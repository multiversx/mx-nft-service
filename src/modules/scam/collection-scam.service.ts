import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { MxExtrasApiService } from 'src/common/services/mx-communication/mx-extras-api.service';

@Injectable()
export class CollectionScamService {
  constructor(
    private mxExtrasApiService: MxExtrasApiService,
    private readonly logger: Logger,
  ) {}

  async manuallySetCollectionScamInfo(collection: string): Promise<boolean> {
    // post
    await this.mxExtrasApiService.setCollectionScam(collection);
    // invalidate cache
    return true;
  }

  async manuallyClearCollectionScamInfo(collection: string): Promise<boolean> {
    // post
    // invalidate cache
    return true;
  }
}
