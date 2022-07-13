import { ProviderRetrieval } from "../models/provider-retrieval";
import { ProviderRetrievalRepo } from "../repos/provider-retrieval-repo";

export class SaveProviderRetrieval {
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

type SaveProviderRetrievalProps = {
  providerRetrievalRepo: ProviderRetrievalRepo
}

type SaveProviderRetrievalDto = {
  providerRetrieval: ProviderRetrieval
}