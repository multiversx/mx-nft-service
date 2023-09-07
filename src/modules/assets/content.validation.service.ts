import { Logger } from '@nestjs/common';
import { InapropriateContentError } from 'src/common/models/errors/inapropriate-content.error';
import { UnsuportedMimetypeError } from 'src/common/models/errors/unsuported-mimetype.error';
import { MediaMimeTypeEnum } from './models/MediaTypes.enum';
import { VerifyContentService } from './verify-content.service';

export class ContentValidation {
  private status: boolean = true;
  private verifyContentService: VerifyContentService;
  private readonly logger: Logger;
  constructor() {
    this.logger = new Logger(ContentValidation.name);
    this.verifyContentService = new VerifyContentService();
  }

  public checkContentType(fileData): this {
    if (!Object.values(MediaMimeTypeEnum).includes(fileData.mimetype as MediaMimeTypeEnum))
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
