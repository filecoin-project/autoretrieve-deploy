import { RetrievalEvent } from "../models/retrieval-event";
import { RetrievalEventBatch } from "../models/retrieval-event-batch";
import { RetrievalEventRepo } from "../repos/retrieval-event-repo";

export class SaveRetrievalEvent {
  private retrievalEventRepo: RetrievalEventRepo;

  constructor(props: SaveRetrievalEventProps) {
    this.retrievalEventRepo = props.retrievalEventRepo;
  }

  async execute(request: SaveRetrievalEventDto): Promise<void> {
    try {
      await this.retrievalEventRepo.saveBatch(request.retrievalEventBatch)
    } catch(err) {
      console.error("Could not save retrieval event.");
      throw err;
    }
  }
}

type SaveRetrievalEventProps = {
  retrievalEventRepo: RetrievalEventRepo
}

type SaveRetrievalEventDto = {
  retrievalEventBatch: RetrievalEventBatch
}