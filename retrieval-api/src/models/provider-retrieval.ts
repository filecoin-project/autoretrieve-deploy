import { ValidationError } from "./validation-error";

export class ProviderRetrieval {
  public static create(props: ProviderRetrievalProps): ProviderRetrieval | ValidationError {
    // Validate the required fields are present
    if(!props.autoretrieveInstanceId) return new ValidationError("Property autoretrieveInstanceId is required");
    if(!props.cid) return new ValidationError("Property cid is required");
    if(!props.errorMessage) return new ValidationError("Property errorMessage is required");
    if(!props.lastStage) return new ValidationError("Property lastStage is required");
    if(!props.peerId) return new ValidationError("Property peerId is required");
    if(!props.retrievalId) return new ValidationError("Property retrievalId is required");
    if(!props.startedAt) return new ValidationError("Property startedAt is required");

    // Property completed is false by default
    let completed = false;
    if(props.completed !== undefined) completed = props.completed;

    // Validate that the started and ended dates are actual dates
    let startedAt, endedAt;

    try {
      startedAt = new Date(props.startedAt);
    } catch(err) {
      return new ValidationError("Property startedAt must be a valid date string.");
    }

    try {
      // Property endedAt is optional, check if it exists first
      if(props.endedAt) endedAt = new Date(props.endedAt);
    } catch(err) {
      return new ValidationError("Property endedAt must be a valid date string.");
    }

    return new ProviderRetrieval({
      ...props,
      completed,
      startedAt,
      endedAt
    });
  }

  get autoretrieveInstanceId(): string {
    return this.props.autoretrieveInstanceId;
  }

  get cid(): string {
    return this.props.cid;
  }

  get completed(): boolean {
    return this.props.completed;
  }

  get endedAt(): string | undefined {
    return this.props.endedAt?.toISOString();
  }

  get errorMessage(): string | undefined {
    return this.props.errorMessage;
  }

  get lastStage(): string {
    return this.props.lastStage;
  }

  get peerId(): string {
    return this.props.peerId;
  }

  get retrievalId(): string {
    return this.props.retrievalId;
  }

  get sizeBytes(): number | undefined {
    return this.props.sizeBytes;
  }

  get startedAt(): string {
    return this.props.startedAt.toISOString();
  }

  private constructor(readonly props: ConstProviderRetrievalProps) {}
}

export type ProviderRetrievalProps = {
  autoretrieveInstanceId: string
  cid: string
  completed?: boolean
  endedAt?: string
  errorMessage?: string
  lastStage: string
  peerId: string
  retrievalId: string
  sizeBytes?: number
  startedAt: string
}

type ConstProviderRetrievalProps = {
  autoretrieveInstanceId: string
  cid: string
  completed: boolean
  endedAt?: Date
  errorMessage?: string
  lastStage: string
  peerId: string
  retrievalId: string
  sizeBytes?: number
  startedAt: Date
}