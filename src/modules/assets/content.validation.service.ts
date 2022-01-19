import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { InapropriateContentError } from 'src/models/errors/inapropriate-content.error';
import { Logger } from 'winston';
import { MediaMimeTypeEnum } from './models/MediaTypes.enum';
import { VerifyContentService } from './verify-content.service';

export class ContentValidation {
  private status: boolean = true;
  private verifyContentService: VerifyContentService;
  constructor(@Inject(WINSTON_MODULE_PROVIDER) logger: Logger) {
    this.verifyContentService = new VerifyContentService(logger);
  }

  public checkContentType(fileData): this {
    if (
      !Object.values(MediaMimeTypeEnum).includes(
        fileData.mimetype as MediaMimeTypeEnum,
      )
    )
      throw new Error('unsuported_media_type');
    return this;
  }

  public async checkContentSensitivity(fileData): Promise<this> {
    try {
      await this.verifyContentService.checkContentSensitivity(fileData);
    } catch (error) {
      if (error.getType() === typeof InapropriateContentError) throw error;
      else {
        console.log(error);
        return;
      }
    }
    return this;
  }

  getStatus(): boolean {
    return this.status;
  }
}
