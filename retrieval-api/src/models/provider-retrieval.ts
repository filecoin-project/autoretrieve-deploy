import { ValidationError } from "./validation-error";

export class ProviderRetrieval {
  public static create(props: ProviderRetrievalProps): ProviderRetrieval | ValidationError {
    // Validate the required fields are present
    if(!props.autoretrieveInstanceId) return new ValidationError("Property autoretrieveInstanceId is required");
    if(!props.cid) return new ValidationError("Property cid is required");
    if(!props.lastStage) return new ValidationError("Property lastStage is required");
    if(!props.peerId) return new ValidationError("Property peerId is required");
    if(!props.retrievalId) return new ValidationError("Property retrievalId is required");
    if(!props.startedAt) return new ValidationError("Property startedAt is required");

    // Property completed is false by default
    let completed = false;
    if(props.completed !== undefined) completed = props.completed;

    // Validate that the started and ended dates are valid date strings
    let startedAt, endedAt;

    startedAt = new Date(props.startedAt);
    if(!this.isValidDate(startedAt)) {
      return new ValidationError("Property startedAt must be a valid date string.");
    }

    // Property endedAt is optional, check if it exists first
    if(props.endedAt) {
      endedAt = new Date(props.endedAt);
      if(!this.isValidDate(endedAt)) {
        return new ValidationError("Property endedAt must be a valid date string.");
      }
    }

    // We don't want to be completed and have no endedAt date
    if(completed === true && endedAt === undefined) {
      return new ValidationError("Property endedAt is required if property completed is true.")
    }

    // We don't want to have an endedAt date provided and not be completed
    if(completed === false && endedAt !== undefined) {
      return new ValidationError("Property completed must be true if property endedAt is provided.")
    }

    return new ProviderRetrieval({
      ...props,
      completed,
      startedAt,
      endedAt
    });
  }

  /**
   * Checks if a Date object is a valid Date.
   * @param date the date to check
   * @returns true if the date is valid, false otherwise
   */
  private static isValidDate(date: Date): boolean {
    // getTime() on an invalid Date will return NaN, and NaN === NaN is always false.
    // NaN === NaN is false
    // valid getTime() === valid getTime() is true
    return date.getTime() === date.getTime();
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

  private constructor(readonly props: ValidatedProviderRetrievalProps) {}
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

type ValidatedProviderRetrievalProps = {
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