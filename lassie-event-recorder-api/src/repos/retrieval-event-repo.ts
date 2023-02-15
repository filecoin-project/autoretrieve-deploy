import { RetrievalEvent } from "../models/retrieval-event";
import { RetrievalEventBatch } from "../models/retrieval-event-batch";

export interface RetrievalEventRepo {
  deleteOldEvents(interval: string): Promise<void>
  save(retrievalEvent: RetrievalEvent): Promise<void>
  saveBatch(retrievalEventBatch: RetrievalEventBatch): Promise<void> 
}