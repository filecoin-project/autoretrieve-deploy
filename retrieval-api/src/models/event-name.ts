import { ValidationError } from "./validation-error";

export class EventName {
  public static VALUES = ["connected", "query-asked", "proposed", "accepted", "first-byte-received", "phase-failed", "succeeded"];

  public static create(value: string): EventName | ValidationError {
    if(!EventName.VALUES.includes(value)) {
      return new ValidationError(`EventName must be created with one of the following values: [${EventName.VALUES}].`);
    }

    return new EventName(value);
  }

  private constructor(readonly value: string) {}
}