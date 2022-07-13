import { ProviderRetrieval } from "../models/provider-retrieval";

export interface ProviderRetrievalRepo {
  save(providerRetrieval: ProviderRetrieval): Promise<void> 
}