import { ValidationError } from "./validation-error";

export class Phase {
  public static VALUES = ["query", "retrieval"];

  public static create(value: string): Phase | ValidationError {
    if(!Phase.VALUES.includes(value)) {
      return new ValidationError(`Phase must be created with one of the following values: [${Phase.VALUES}].`);
    }

    return new Phase(value);
  }

  private constructor(readonly value: string) {}
}