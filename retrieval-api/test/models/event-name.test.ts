import { expect } from "chai";
import { EventName } from "../../src/models/event-name";
import { ValidationError } from "../../src/models/validation-error";

describe("EventName", () => {
  describe("create()", () => {
    it("returns an Event for valid values", () => {
      const event = EventName.create(EventName.VALUES[0]);
      if(event instanceof ValidationError) expect.fail(event.message);

      expect(event).to.be.instanceOf(EventName, "Valid values should return a Event.");
    });
    
    it("returns a ValidationError for invalid values", () => {
      const event = EventName.create("invalid value");
      expect(event).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");
    });
  });
});