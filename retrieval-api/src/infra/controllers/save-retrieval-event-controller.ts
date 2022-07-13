import { APIGatewayProxyEvent } from "aws-lambda";
import { RetrievalEvent } from "../../models/retrieval-event";
import { ValidationError } from "../../models/validation-error";
import { SaveRetrievalEvent } from "../../use-cases/save-retrieval-event";

export class SaveRetrievalEventController {
  constructor(private useCase: SaveRetrievalEvent) {}

  public handler = async (event: APIGatewayProxyEvent): Promise<any> => {
    // Either parse the body or provide an empty body
    let body;
    if(event.body === null) {
      body = {};
    } else {
      try {
        body = JSON.parse(event.body);
      } catch(err) {
        console.error(err);
        console.warn("Couldn't parse request body. Body being set to empty object.", JSON.stringify(event));
        body = {};
      }
    }

    const retrievalEvent = RetrievalEvent.create(body);
    if(retrievalEvent instanceof ValidationError) {
      console.debug("Could not create Retrieval Event instance.", retrievalEvent.message, retrievalEvent.details);
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
      console.error("Error while executing save retrieval event use case.", err);
      return {
        statusCode: 500
      }
    }
  }
}

export type SaveRetrievalEventControllerEvent = APIGatewayProxyEvent;