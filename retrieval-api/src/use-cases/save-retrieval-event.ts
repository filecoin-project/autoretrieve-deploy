import { RetrievalEvent } from "../models/retrieval-event";
import { RetrievalEventRepo } from "../repos/retrieval-event-repo";

export class SaveRetrievalEvent {
  private retrievalEventRepo: RetrievalEventRepo;

  constructor(props: SaveRetrievalEventProps) {
    this.retrievalEventRepo = props.retrievalEventRepo;
  }

  async execute(request: SaveRetrievalEventDto): Promise<void> {
    try {
      await this.retrievalEventRepo.save(request.retrievalEvent)
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
  retrievalEvent: RetrievalEvent
}