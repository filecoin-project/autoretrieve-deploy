import { EventName } from "./event-name";
import { EventTime } from "./event-time";
import { Phase } from "./phase";
import { PhaseStartTime } from "./phase-start-time";
import { ValidationError } from "./validation-error";

export class RetrievalEvent {
  public static create(props: RetrievalEventProps): RetrievalEvent | ValidationError {
    if(!props.retrievalId) return new ValidationError("Property retrievalId is required.");
    if(!props.instanceId) return new ValidationError("Property instanceId is required.");
    if(!props.cid) return new ValidationError("Property cid is required.");
    if(!props.phase) return new ValidationError("Property phase is required.");
    if(!props.phaseStartTime) return new ValidationError("Property phaseStartTime is required.");
    if(!props.eventName) return new ValidationError("Property eventName is required.");
    if(!props.eventTime) return new ValidationError("Property eventTime is required.");

    const phase = Phase.create(props.phase);
    if(phase instanceof ValidationError) {
      return new ValidationError(`Property phase failed validation. ${phase.message}`, phase.details);
    }

    const phaseStartTime = PhaseStartTime.create(props.phaseStartTime);
    if(phaseStartTime instanceof ValidationError) {
      return new ValidationError(`Property phaseStartTime failed validation. ${phaseStartTime.message}`, phaseStartTime.details);
    }

    const eventName = EventName.create(props.eventName);
    if(eventName instanceof ValidationError) {
      return new ValidationError(`Property eventName failed validation. ${eventName.message}`, eventName.details);
    }

    const eventTime = EventTime.create(props.eventTime);
    if(eventTime instanceof ValidationError) {
      return new ValidationError(`Property eventTime failed validation. ${eventTime.message}`, eventTime.details);
    }

    return new RetrievalEvent({
      ...props,
      phase,
      phaseStartTime,
      eventName,
      eventTime
    });
  }

  get retrievalId(): string {
    return this.props.retrievalId;
  }

  get instanceId(): string {
    return this.props.instanceId;
  }

  get cid(): string {
    return this.props.cid;
  }

  get storageProviderId(): string | undefined {
    return this.props.storageProviderId;
  }

  get phase(): Phase {
    return this.props.phase;
  }

  get phaseStartTime(): PhaseStartTime {
    return this.props.phaseStartTime;
  }

  get eventName(): EventName {
    return this.props.eventName;
  }

  get eventTime(): EventTime {
    return this.props.eventTime;
  }

  get eventDetails(): any | undefined {
    return this.props?.eventDetails;
  }


  private constructor(readonly props: ValidatedRetrievalEventProps) {}

}

export type RetrievalEventProps = {
  retrievalId: string
  instanceId: string
  cid: string
  storageProviderId?: string
  phase: string
  phaseStartTime: string
  eventName: string
  eventTime: string
  eventDetails?: any
}

type ValidatedRetrievalEventProps = {
  retrievalId: string
  instanceId: string
  cid: string
  storageProviderId?: string
  phase: Phase
  phaseStartTime: PhaseStartTime
  eventName: EventName
  eventTime: EventTime
  eventDetails?: any
}