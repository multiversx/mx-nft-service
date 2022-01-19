import { ReadStream } from 'fs';
import { grpc } from '../../../node_modules/clarifai-nodejs-grpc';
import * as clarifai from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb';
import * as service from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_pb';
import * as resources from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import { InapropriateContentError } from 'src/models/errors/inapropriate-content.error';
import { Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

function getClarifaiClient() {
  return new clarifai.V2Client(
    process.env.CLARIFAI_API_DOMAIN,
    grpc.ChannelCredentials.createSsl(),
  );
}

export class VerifyContentService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  async checkContentSensitivity(file: any) {
    const client = getClarifaiClient();
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Key ${process.env.CLARIFAI_APP_KEY}`);

    const request = await this.getRequest(file);
    if (request)
      client.postModelOutputs(request, metadata, (err, response) => {
        if (err) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            message: err.message,
            name: err.name,
          };

          this.logger.error(customError);
          return;
        }

        if (response.getStatus().getCode() !== 10000) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            status: response.getStatus().getDetails(),
            message:
              'Received failed status: ' +
              response.getStatus().getDescription() +
              '\n' +
              response.getStatus().getDetails(),
            name: err.name,
          };

          this.logger.warning(customError);
          return;
        }
        if (file.mimetype.includes('image'))
          this.processImagePredictions(response);
        if (file.mimetype.includes('video')) {
          this.processVideoPredictions(response);
        }
      });
  }

  private async getRequest(image): Promise<service.PostModelOutputsRequest> {
    const readStream = await image.createReadStream();
    const fileType = await this.readStreamToBuffer(readStream);

    const imageBytes = Uint8Array.from(fileType);
    const request = new service.PostModelOutputsRequest();
    request.setModelId(process.env.CLARIFAI_MODEL_ID);
    if (image.mimetype.includes('image'))
      return this.addImageInput(request, imageBytes);
    if (image.mimetype.includes('video')) {
      return this.addVideoInput(request, imageBytes);
    }

    return;
  }

  private addImageInput(
    request: service.PostModelOutputsRequest,
    imageBytes: Uint8Array,
  ) {
    request.addInputs(
      new resources.Input().setData(
        new resources.Data().setImage(
          new resources.Image().setBase64(imageBytes),
        ),
      ),
    );
    return request;
  }

  private addVideoInput(
    request: service.PostModelOutputsRequest,
    imageBytes: Uint8Array,
  ) {
    request.addInputs(
      new resources.Input().setData(
        new resources.Data().setVideo(
          new resources.Video().setBase64(imageBytes),
        ),
      ),
    );
    return request;
  }

  private processVideoPredictions(response: service.MultiOutputResponse) {
    for (const frame of response
      .getOutputsList()[0]
      .getData()
      .getFramesList()) {
      for (const c of frame.getData().getConceptsList()) {
        if (
          c.getName() === 'nsfw' &&
          c.getValue() >= parseFloat(process.env.CLARIFAI_TRESHOLD)
        ) {
          throw new InapropriateContentError('Inapropriate content');
        }
      }
    }
  }

  private processImagePredictions(response: service.MultiOutputResponse) {
    for (const c of response.getOutputsList()[0].getData().getConceptsList()) {
      if (
        c.getName() === 'nsfw' &&
        c.getValue() >= parseFloat(process.env.CLARIFAI_TRESHOLD)
      ) {
        throw new InapropriateContentError('Inapropriate content');
      }

      console.log(
        parseInt(process.env.CLARIFAI_TRESHOLD),
        c.getName() + ': ' + c.getValue(),
      );
    }
  }

  async readStreamToBuffer(readStream: ReadStream): Promise<Buffer> {
    let chunks = [];
    try {
      for await (const chunk of readStream) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      throw error;
    }
  }
}
