import { ProviderRetrieval, ProviderRetrievalProps } from "../../src/models/provider-retrieval";
import { ValidationError } from "../../src/models/validation-error";
import { expect } from "chai";

const minimumProps: ProviderRetrievalProps = {
  autoretrieveInstanceId: "test instance ID",
  cid: "test cid",
  lastStage: "test stage",
  peerId: "test peer ID",
  retrievalId: "test retrieval ID",
  startedAt: "1970-01-01T00:00:00.000Z"
};

describe("ProviderRetrieval", () => {
  describe("create()", () => {
    it("validates required fields", () => {
      const props = {...minimumProps};
      
      // Delete properties one at a time
      let keys = Object.keys(props);
      for (const key of keys) {
        let badProps = {...props};
        // @ts-ignore | typing isn't letting us delete keys by string
        delete badProps[key];
        const retrieval = ProviderRetrieval.create(badProps);
        expect(retrieval).to.be.instanceOf(ValidationError, `${key} should be validated as a required field`);
      }
    });

    it("sets completed to false by default", () => {
      const retrieval = ProviderRetrieval.create(minimumProps);
      if(retrieval instanceof ValidationError) expect.fail(retrieval.message);

      expect(retrieval.completed).to.be.false;
    });

    it("validates startedAt", () => {
      const retrieval = ProviderRetrieval.create({
        ...minimumProps,
        startedAt: "not a date"
      });
      expect(retrieval).to.be.instanceOf(ValidationError, "startedAt should be validated as a valid Date object")
    });

    it("validates endedAt", () => {
      const retrieval = ProviderRetrieval.create({
        ...minimumProps,
        endedAt: "not a date"
      });
      expect(retrieval).to.be.instanceOf(ValidationError, "endedAt should be validated as a valid Date object");
    });

    it("validates completed & endedAt are provided together", () => {
      // completed=true without an endedAt
      const r1 = ProviderRetrieval.create({
        ...minimumProps,
        completed: true
      });
      expect(r1).to.be.instanceOf(ValidationError, "completed should not be true without a provided endedAt property");

      // completed=false with an endedAt
      const r2 = ProviderRetrieval.create({
        ...minimumProps,
        completed: false,
        endedAt: "2022-01-01T00:00:00Z"
      });
      expect(r2).to.be.instanceOf(ValidationError, "completed should be true with a provided endedAt property");
      
      // both completed=true and endedAt
      const r3 = ProviderRetrieval.create({
        ...minimumProps,
        completed: true,
        endedAt: "2022-01-01T00:00:00Z"
      });
      if(r3 instanceof ValidationError) expect.fail(r3.message);
      expect(r3).to.be.instanceOf(ProviderRetrieval);
    });
  });

  describe("date properties", () => {
    it("return an ISO8601 UTC date string", () => {
      const retrieval = ProviderRetrieval.create({
        ...minimumProps,
        completed: true,
        endedAt: "2022-01-01T00:00:00.000Z"
      });
      if(retrieval instanceof ValidationError) expect.fail(retrieval.message);

      expect(retrieval.startedAt).to.eql("1970-01-01T00:00:00.000Z");
      expect(retrieval.endedAt).to.eql("2022-01-01T00:00:00.000Z");
    });
  });
});