import { RetrievalEvent, RetrievalEventProps } from "./retrieval-event";
import { ValidationError } from "./validation-error";

export class RetrievalEventBatch {
  public static create(props: RetrievalEventBatchProps): RetrievalEventBatch | ValidationError {
    if(!props.events === undefined) return new ValidationError("Property events is required.");
    
    const events: RetrievalEvent[] = [];
    const ignoredEvents = [];
    for(let i = 0; i < props.events.length; i++) {
      const retrievalEvent = RetrievalEvent.create(props.events[i]);
      if(retrievalEvent instanceof ValidationError) {
        ignoredEvents.push({
          event: props.events[i],
          error: retrievalEvent
        });
        continue;
      }

      events.push(retrievalEvent);
    }

    if (ignoredEvents.length > 0) {
      console.warn(`Could not validate entire event batch. ${ignoredEvents.length}/${props.events.length} were invalid and will be skipped.`, { ignoredEvents });
    }
    return new RetrievalEventBatch({ events });
  }

  get events(): RetrievalEvent[] {
    return this.props.events;
  }

  private constructor(readonly props: ValidatedRetrievalEventBatchProps) {}
}

export type RetrievalEventBatchProps = {
  events: RetrievalEventProps[]
}

type ValidatedRetrievalEventBatchProps = {
  events: RetrievalEvent[]
}