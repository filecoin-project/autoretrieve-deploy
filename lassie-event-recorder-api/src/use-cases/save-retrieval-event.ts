import { RetrievalEventBatch } from "../models/retrieval-event-batch";
import { RetrievalEventRepo } from "../repos/retrieval-event-repo";

export class SaveRetrievalEvent {
  private eventRepo: RetrievalEventRepo;

  constructor(props: SaveRetrievalEventProps) {
    this.eventRepo = props.retrievalEventRepo;
  }

  async execute(request: SaveRetrievalEventDto): Promise<void> {
    try {
      await this.eventRepo.saveBatch(request.retrievalEventBatch)
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