import { ValidationError } from "./validation-error";

export class EventName {
  public static VALUES = ["candidates-found", "candidates-filtered", "started", "connected", "query-asked", "query-asked-filtered", "proposed", "accepted", "first-byte-received", "failure", "success"];

  public static create(value: string): EventName | ValidationError {
    if(!EventName.VALUES.includes(value)) {
      return new ValidationError(`EventName must be created with one of the following values: [${EventName.VALUES}].`);
    }

    return new EventName(value);
  }

  private constructor(readonly value: string) {}
}
