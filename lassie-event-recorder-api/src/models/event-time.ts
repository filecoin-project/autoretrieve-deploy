import { ValidationError } from "./validation-error";

export class EventTime {
  public static create(value: string): EventTime | ValidationError {
    const date = new Date(value);
    if(date.toString() === "Invalid Date") {
      return new ValidationError("EventTime must be created with a valid date string.");
    }

    return new EventTime(date.toISOString());
  }

  private constructor(readonly value: string) {}
}