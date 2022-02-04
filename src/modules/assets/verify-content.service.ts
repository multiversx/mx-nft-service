import { ReadStream } from 'fs';
import { grpc } from '../../../node_modules/clarifai-nodejs-grpc';
import * as clarifai from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb';
import * as service from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_pb';
import * as resources from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import { InapropriateContentError } from 'src/models/errors/inapropriate-content.error';

export class VerifyContentService {
  async checkContentSensitivity(file: any) {
    const client = this.getClarifaiClient();
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Key ${process.env.CLARIFAI_APP_KEY}`);

    const request = await this.getRequest(file);
    if (request) {
      await this.getPredictions(client, request, metadata, file);
    }
  }

  private getClarifaiClient() {
    return new clarifai.V2Client(
      process.env.CLARIFAI_API_DOMAIN,
      grpc.ChannelCredentials.createSsl(),
    );
  }

  private async getRequest(file): Promise<service.PostModelOutputsRequest> {
    const readStream = await file.createReadStream();
    const fileBuffer = await this.readStreamToBuffer(readStream);
    const imageBytes = Uint8Array.from(fileBuffer);
    const request = new service.PostModelOutputsRequest();
    request.setModelId(process.env.CLARIFAI_MODEL_ID);
    if (file.mimetype.includes('image'))
      return this.addImageInput(request, imageBytes);
    if (file.mimetype.includes('video')) {
      return this.addVideoInput(request, imageBytes);
    }
    return;
  }

  private getPredictions(
    client: clarifai.V2Client,
    request: service.PostModelOutputsRequest,
    metadata: grpc.Metadata,
    file: any,
  ) {
    return new Promise((resolve, reject) => {
      client.postModelOutputs(request, metadata, (err, response) => {
        if (err) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            message: err.message,
            name: err.name,
          };
          return reject(customError);
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
            name: err?.name,
          };
          return reject(customError);
        }
        if (file.mimetype.includes('image')) {
          resolve(this.processImagePredictions(response, reject));
        }
        if (file.mimetype.includes('video')) {
          resolve(this.processVideoPredictions(response, reject));
        }
      });
    });
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

  private processImagePredictions(
    response: service.MultiOutputResponse,
    reject: (reason?: any) => void,
  ) {
    const concepts = response.getOutputsList()[0].getData().getConceptsList();
    for (const concept of concepts) {
      this.checkNsfw(concept, reject);
    }
  }

  private processVideoPredictions(
    response: service.MultiOutputResponse,
    reject: (reason?: any) => void,
  ) {
    const frames = response.getOutputsList()[0].getData().getFramesList();
    for (const frame of frames) {
      const concepts = frame.getData().getConceptsList();
      for (const concept of concepts) {
        this.checkNsfw(concept, reject);
      }
    }
  }

  private checkNsfw(
    concept: resources.Concept,
    reject: (reason?: any) => void,
  ) {
    if (
      concept.getName() === 'nsfw' &&
      concept.getValue() >= parseFloat(process.env.CLARIFAI_TRESHOLD)
    ) {
      reject(new InapropriateContentError('Inapropriate content'));
    }
  }

  private async readStreamToBuffer(readStream: ReadStream): Promise<Buffer> {
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
