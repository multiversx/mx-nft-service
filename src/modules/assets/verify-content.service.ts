import { ReadStream } from 'fs';
import { grpc } from '../../../node_modules/clarifai-nodejs-grpc';
import * as clarifai from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_grpc_pb';
import * as service from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/service_pb';
import * as resources from '../../../node_modules/clarifai-nodejs-grpc/proto/clarifai/api/resources_pb';
import { InapropriateContentError } from 'src/common/models/errors/inapropriate-content.error';

export class VerifyContentService {
  async checkContentSensitivityForUrl(fileUrl: string, mimeType: string): Promise<number> {
    const client = this.getClarifaiClient();
    const metadata = new grpc.Metadata();
    metadata.set('authorization', `Key ${process.env.CLARIFAI_APP_KEY}`);

    const request = await this.getRequestForUrl(fileUrl, mimeType);
    if (request) {
      return await this.getPredictionsForUrl(client, request, metadata, mimeType);
    }
  }

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
    return new clarifai.V2Client(process.env.CLARIFAI_API_DOMAIN, grpc.ChannelCredentials.createSsl());
  }

  private async getRequest(file): Promise<service.PostWorkflowResultsRequest> {
    const readStream = await file.createReadStream();
    const fileBuffer = await this.readStreamToBuffer(readStream);
    const imageBytes = Uint8Array.from(fileBuffer);
    const request = new service.PostWorkflowResultsRequest();
    request.setWorkflowId(process.env.CLARIFAI_WORKFLOW_ID);
    if (file.mimetype.includes('image')) return this.addImageInput(request, imageBytes);
    if (file.mimetype.includes('video')) {
      return this.addVideoInput(request, imageBytes);
    }
    return;
  }

  private async getRequestForUrl(url: string, mimetype: string): Promise<service.PostWorkflowResultsRequest> {
    const request = new service.PostWorkflowResultsRequest();
    request.setWorkflowId(process.env.CLARIFAI_WORKFLOW_ID);
    if (mimetype.includes('image')) {
      return this.addImageInputUrl(request, url);
    }

    // This will be disable for the moment
    // if (mimetype.includes('video')) {
    //   return this.addVideoInputForUrl(request, url);
    // }
    return;
  }

  private getPredictions(client: clarifai.V2Client, request: service.PostWorkflowResultsRequest, metadata: grpc.Metadata, file: any) {
    return new Promise((resolve, reject) => {
      client.postWorkflowResults(request, metadata, (err, response) => {
        if (err) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            message: err?.message,
            name: err?.name,
          };
          return reject(customError);
        }

        if (response.getStatus().getCode() !== 10000) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            status: response?.getStatus()?.getDetails(),
            message: 'Received failed status: ' + response?.getStatus()?.getDescription() + '\n' + response?.getStatus()?.getDetails(),
            name: 'ContentSensitivityError',
          };
          return reject(customError);
        }
        if (file.mimetype.includes('image')) {
          resolve(this.processImagePredictions(response, reject));
        }

        if (file.mimetype.includes('video')) {
          resolve(this.processVideoPredictions(response, reject));
        }
        return 0.01;
      });
    });
  }

  private getPredictionsForUrl(
    client: clarifai.V2Client,
    request: service.PostWorkflowResultsRequest,
    metadata: grpc.Metadata,
    mimeType: any,
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      client.postWorkflowResults(request, metadata, (err, response) => {
        if (err) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            message: err?.message,
            name: err?.name,
          };
          return reject(customError);
        }

        const SUCCESS_STATUS_CODE = 10000;
        if (response.getStatus().getCode() !== SUCCESS_STATUS_CODE) {
          let customError = {
            method: 'VerifyContentService.checkContentSensitivity',
            status: response?.getStatus()?.getDetails(),
            message: 'Received failed status: ' + response?.getStatus()?.getDescription() + '\n' + response?.getStatus()?.getDetails(),
            name: 'ContentSensitivityError',
          };
          return reject(customError);
        }
        if (mimeType.includes('image')) {
          return resolve(this.processImagePredictionsForUrl(response));
        }

        // This will be disable for the moment
        // if (mimeType.includes('video')) {
        //   return resolve(this.processVideoPredictionsUrl(response));
        // }
        return 0.01;
      });
    });
  }

  private addImageInput(request: service.PostWorkflowResultsRequest, imageBytes: Uint8Array) {
    request.addInputs(new resources.Input().setData(new resources.Data().setImage(new resources.Image().setBase64(imageBytes))));
    return request;
  }

  private addImageInputUrl(request: service.PostWorkflowResultsRequest, url: string) {
    request.addInputs(new resources.Input().setData(new resources.Data().setImage(new resources.Image().setUrl(url))));
    return request;
  }

  private addVideoInput(request: service.PostWorkflowResultsRequest, imageBytes: Uint8Array) {
    request.addInputs(new resources.Input().setData(new resources.Data().setVideo(new resources.Video().setBase64(imageBytes))));
    return request;
  }

  private addVideoInputForUrl(request: service.PostWorkflowResultsRequest, url: string) {
    request.addInputs(new resources.Input().setData(new resources.Data().setVideo(new resources.Video().setUrl(url))));
    return request;
  }

  private processImagePredictions(response: service.PostWorkflowResultsResponse, reject: (reason?: any) => void) {
    const results = response.getResultsList()[0];
    this.processImageNsfwModel(results.getOutputsList()[0], reject);
    this.processImageLogoModel(results.getOutputsList()[1], reject);
  }

  private processImagePredictionsForUrl(response: service.PostWorkflowResultsResponse) {
    const results = response.getResultsList()[0];
    return this.processImageNsfwModelUrl(results.getOutputsList()[0]);
  }

  private processImageNsfwModel(output: resources.Output, reject: (reason?: any) => void) {
    const concepts = output.getData().getConceptsList();
    for (const concept of concepts) {
      this.checkNsfw(concept, reject);
    }
  }

  private processImageNsfwModelUrl(output: resources.Output) {
    const concepts = output.getData().getConceptsList();
    for (const concept of concepts) {
      if (concept.getName() === 'nsfw') {
        return concept.getValue();
      }
    }
    return 0.01;
  }

  private processImageLogoModel(output: resources.Output, reject: (reason?: any) => void) {
    for (const region of output.getData().getRegionsList()) {
      for (const concept of region.getData().getConceptsList()) {
        this.checkLogo(concept, reject);
      }
    }
  }

  private processVideoPredictions(response: service.PostWorkflowResultsResponse, reject: (reason?: any) => void) {
    const results = response.getResultsList()[0];
    this.processNsfwVideoPredictions(results.getOutputsList()[0], reject);
    this.processLogoVideoPredictions(results.getOutputsList()[1], reject);
  }

  private processVideoPredictionsUrl(response: service.PostWorkflowResultsResponse): number {
    const results = response.getResultsList()[0];
    return this.processNsfwVideoPredictionsUrl(results.getOutputsList()[0]);
  }

  private processNsfwVideoPredictionsUrl(output: resources.Output): number {
    let nsfwValues: number[] = [];
    const frames = output.getData().getFramesList();
    for (const frame of frames) {
      const concepts = frame.getData().getConceptsList();
      for (const concept of concepts) {
        if (concept.getName() === 'nsfw') {
          nsfwValues.push(concept.getValue());
        }
      }
    }
    if (nsfwValues?.length > 0) {
      return Math.max(...nsfwValues);
    }
    return 0.01;
  }
  private processNsfwVideoPredictions(output: resources.Output, reject: (reason?: any) => void) {
    const frames = output.getData().getFramesList();
    for (const frame of frames) {
      const concepts = frame.getData().getConceptsList();
      for (const concept of concepts) {
        this.checkNsfw(concept, reject);
      }
    }
  }

  private processLogoVideoPredictions(output: resources.Output, reject: (reason?: any) => void) {
    for (const frame of output.getData().getFramesList()) {
      for (const region of frame.getData().getRegionsList()) {
        const concepts = region.getData().getConceptsList();
        for (const concept of concepts) {
          this.checkLogo(concept, reject);
        }
      }
    }
  }

  private checkNsfw(concept: resources.Concept, reject: (reason?: any) => void) {
    if (concept.getName() === 'nsfw' && concept.getValue() >= parseFloat(process.env.CLARIFAI_TRESHOLD)) {
      reject(new InapropriateContentError('Seems to contain inappropriate content'));
    }
  }

  private checkLogo(concept: resources.Concept, reject: (reason?: any) => void) {
    if (concept.getValue() >= parseFloat(process.env.CLARIFAI_TRESHOLD)) {
      reject(new InapropriateContentError('Seems to contain brand names'));
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
