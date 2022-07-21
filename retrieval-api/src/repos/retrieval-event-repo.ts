import { RetrievalEvent } from "../models/retrieval-event";

export interface RetrievalEventRepo {
  save(retrievalEvent: RetrievalEvent): Promise<void> 
}