import { ProviderRetrieval, ProviderRetrievalProps } from "../../models/provider-retrieval";
import { ValidationError } from "../../models/validation-error";
import { SaveProviderRetrieval } from "../../use-cases/save-provider-retrieval";

export class SaveProviderRetrievalController {
  constructor(private useCase: SaveProviderRetrieval) {}

  public handler = async (event: Event, _context: any): Promise<any> => {
    let providerRetrieval = ProviderRetrieval.create(event);
    if(providerRetrieval instanceof ValidationError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "ValidationError",
          errorMessage: providerRetrieval.message,
          errorDetails: providerRetrieval.details
        })
      };
    }

    try {
      await this.useCase.execute({ providerRetrieval });
      return {
        statusCode: 204
      }
    } catch(err) {
      throw err;
    }
  }
}

type Event = ProviderRetrievalProps;