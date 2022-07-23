import { RetrievalEvent } from "../../models/retrieval-event";
import { ValidationError } from "../../models/validation-error";
import { SaveRetrievalEvent } from "../../use-cases/save-retrieval-event";

export class SaveRetrievalEventController {
  constructor(private useCase: SaveRetrievalEvent) {}

  public handler = async (event: SaveRetrievalEventControllerEvent): Promise<any> => {
    const retrievalEvent = RetrievalEvent.create(event);
    if(retrievalEvent instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "ValidationError",
          errorMessage: retrievalEvent.message,
          errorDetails: retrievalEvent.details
        })
      };
    }

    try {
      await this.useCase.execute({ retrievalEvent });
      return {
        statusCode: 201
      }
    } catch(err) {
      console.error(err);
      return {
        statusCode: 500
      }
    }
  }
}

export type SaveRetrievalEventControllerEvent = {
  retrievalId: string
  instanceId: string
  cid: string
  storageProviderId?: string
  phase: string
  phaseStartTime: string
  eventName: string
  eventTime: string
  eventDetails: any
};