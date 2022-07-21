import { ValidationError } from "./validation-error";

export class PhaseStartTime {
  public static create(value: string): PhaseStartTime | ValidationError {
    const date = new Date(value);
    if(date.getTime() !== date.getTime()) {
      return new ValidationError("PhaseStartTime must be created with a valid date string.");
    }

    return new PhaseStartTime(date.toISOString());
  }

  private constructor(readonly value: string) {}
}