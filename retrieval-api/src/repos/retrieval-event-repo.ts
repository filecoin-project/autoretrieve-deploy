import { RetrievalEvent } from "../models/retrieval-event";
import { RetrievalEventBatch } from "../models/retrieval-event-batch";

export interface RetrievalEventRepo {
  save(retrievalEvent: RetrievalEvent): Promise<void>
  saveBatch(retrievalEventBatch: RetrievalEventBatch): Promise<void> 
}