import { expect } from "chai";
import { Phase } from "../../src/models/phase";
import { ValidationError } from "../../src/models/validation-error";

describe("Phase", () => {
  describe("create()", () => {
    it("returns a Phase for valid values", () => {
      const phase = Phase.create(Phase.VALUES[0]);
      if(phase instanceof ValidationError) expect.fail(phase.message);

      expect(phase).to.be.instanceOf(Phase, "Valid values should return a Phase.");
    });
    
    it("returns a ValidationError for invalid values", () => {
      const phase = Phase.create("invalid value");
      expect(phase).to.be.instanceOf(ValidationError, "Invalid values should return a ValidationError.");
    });
  });
});