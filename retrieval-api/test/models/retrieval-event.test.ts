import { expect } from "chai";
import { EventName } from "../../src/models/event-name";
import { Phase } from "../../src/models/phase";
import { RetrievalEvent, RetrievalEventProps } from "../../src/models/retrieval-event";
import { ValidationError } from "../../src/models/validation-error";

const minimumProps: RetrievalEventProps = {
  retrievalId: "test retrieval ID",
  instanceId: "test instance ID",
  cid: "test cid",
  phase: Phase.VALUES[0],
  phaseStartTime: "1970-01-01T00:00:00.000Z",
  eventName: EventName.VALUES[0],
  eventTime: "1970-01-02T00:00:00.000Z"
};

describe("RetrievalEvent", () => {
  describe("create()", () => {
    it("returns a RetrievalEvent when given valid values", () => {
      const retrievalEvent = RetrievalEvent.create(minimumProps);
      if(retrievalEvent instanceof ValidationError) expect.fail(retrievalEvent.message);

      expect(retrievalEvent).to.be.instanceOf(RetrievalEvent);
    });

    it("returns a ValidationError for missing required fields", () => {
      const props = {...minimumProps};
      
      // Delete properties one at a time
      let keys = Object.keys(props);
      for (const key of keys) {
        let badProps = {...props};
        // @ts-ignore | typing isn't letting us delete keys by string
        delete badProps[key];
        const retrievalEvent = RetrievalEvent.create(badProps);
        expect(retrievalEvent).to.be.instanceOf(ValidationError, `${key} should be validated as a required field`);
      }
    });
  });
});