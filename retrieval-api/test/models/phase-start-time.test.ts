import { expect } from "chai";
import { PhaseStartTime } from "../../src/models/phase-start-time";
import { ValidationError } from "../../src/models/validation-error";

describe("PhaseStartTime", () => {
  describe("create()", () => {
    it("returns an ISO8601 UTC date string for valid values", () => {
      const phaseStartTime = PhaseStartTime.create("2022-01-01T00:00:00.000Z");
      if(phaseStartTime instanceof ValidationError) expect.fail(phaseStartTime.message);

      expect(phaseStartTime.value).to.eql("2022-01-01T00:00:00.000Z");
    });

    it("returns a ValidationError for invalid values", () => {
      const phaseStartTime = PhaseStartTime.create("not a date string");
      expect(phaseStartTime).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");

      // Try an undefined value
      let dateStr: string = undefined as unknown as string;
      const phaseStartTime2 = PhaseStartTime.create(dateStr);
      expect(phaseStartTime2).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");
    });
  });
});