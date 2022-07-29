import { expect } from "chai";
import { EventTime } from "../../src/models/event-time";
import { ValidationError } from "../../src/models/validation-error";

describe("EventTime", () => {
  describe("create()", () => {
    it("returns an ISO8601 UTC date string for valid values", () => {
      const eventTime = EventTime.create("2022-01-01T00:00:00.000Z");
      if(eventTime instanceof ValidationError) expect.fail(eventTime.message);

      expect(eventTime.value).to.eql("2022-01-01T00:00:00.000Z");
    });

    it("returns a ValidationError for invalid values", () => {
      const eventTime = EventTime.create("not a date string");
      expect(eventTime).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");

      // Try an undefined value
      let dateStr: string = undefined as unknown as string;
      const eventTime2 = EventTime.create(dateStr);
      expect(eventTime2).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");
    });
  });
});