import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InapropriateContentError } from 'src/common/models/errors/inapropriate-content.error';
import { UnsuportedMimetypeError } from 'src/common/models/errors/unsuported-mimetype.error';
import { Logger } from 'winston';
import { MediaMimeTypeEnum } from './models/MediaTypes.enum';
import { VerifyContentService } from './verify-content.service';

export class ContentValidation {
  private status: boolean = true;
  private verifyContentService: VerifyContentService;
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private logger: Logger) {
    this.verifyContentService = new VerifyContentService();
  }

  public checkContentType(fileData): this {
    if (
      !Object.values(MediaMimeTypeEnum).includes(
        fileData.mimetype as MediaMimeTypeEnum,
      )
    )
      throw new UnsuportedMimetypeError('Unsupported media type');
    return this;
  }

  public async checkContentSensitivity(fileData): Promise<this> {
    try {
      await this.verifyContentService.checkContentSensitivity(fileData);
    } catch (error) {
      if (error instanceof InapropriateContentError) {
        throw error;
      } else {
        this.logger.error(error);
        return this;
      }
    }
    return this;
  }

  getStatus(): boolean {
    return this.status;
  }
}
