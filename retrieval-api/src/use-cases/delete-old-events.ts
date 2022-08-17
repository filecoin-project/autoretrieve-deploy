import { RetrievalEventRepo } from "../repos/retrieval-event-repo"

type DeleteOldEventsProps = {
  retrievalEventRepo: RetrievalEventRepo
}

export class DeleteOldEvents {
  private retrievalEventRepo: RetrievalEventRepo;

  constructor(props: DeleteOldEventsProps) {
    this.retrievalEventRepo = props.retrievalEventRepo;
  }

  async execute(): Promise<void> {
    try {
      await this.retrievalEventRepo.deleteOldEvents();
    } catch(err) {
      console.error("Could not delete old events.");
      throw err;
    }
  }
}