import { PostgresProviderRetrievalRepo } from "../infra/repos/postgres-provider-retrieval-repo";
import { ProviderRetrieval } from "../models/provider-retrieval";
import { ValidationError } from "../models/validation-error";
import { ProviderRetrievalRepo } from "../repos/provider-retrieval-repo";

class SaveProviderRetrieval {
  private providerRetrievalRepo: ProviderRetrievalRepo;

  constructor(props: SaveProviderRetrievalProps) {
    this.providerRetrievalRepo = props.providerRetrievalRepo;
  }

  async execute(request: SaveProviderRetrievalDto): Promise<void> {
    try {
      await this.providerRetrievalRepo.save(request.providerRetrieval)
    } catch(err) {
      console.error("Could not save provider retrieval.");
      throw err;
    }
  }
}

class SaveProviderRetrievalController {
  constructor(private useCase: SaveProviderRetrieval) {}

  public handler = async (event: any, _context: any): Promise<any> => {
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

type SaveProviderRetrievalProps = {
  providerRetrievalRepo: ProviderRetrievalRepo
}

type SaveProviderRetrievalDto = {
  providerRetrieval: ProviderRetrieval
}

const providerRetrievalRepo = new PostgresProviderRetrievalRepo();
const useCase = new SaveProviderRetrieval({ providerRetrievalRepo });
exports.handler = new SaveProviderRetrievalController(useCase).handler;