import { RetrievalEventRepo } from "../repos/retrieval-event-repo"

type DeleteOldEventsProps = {
  interval: string
  retrievalEventRepo: RetrievalEventRepo
}

export class DeleteOldEvents {
  private interval: string
  private retrievalEventRepo: RetrievalEventRepo;

  constructor(props: DeleteOldEventsProps) {
    this.interval = props.interval;
    this.retrievalEventRepo = props.retrievalEventRepo;
  }

  async execute(): Promise<void> {
    try {
      await this.retrievalEventRepo.deleteOldEvents(this.interval);
    } catch(err) {
      console.error("Could not delete old events.");
      throw err;
    }
  }
}