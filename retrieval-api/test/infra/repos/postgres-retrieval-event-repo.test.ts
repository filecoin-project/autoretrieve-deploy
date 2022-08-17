import { PostgresRetrievalEventRepo } from "../../../src/infra/repos/postgres-retrieval-event-repo";
import { stub } from "sinon";
import { RetrievalEventBatch } from "../../../src/models/retrieval-event-batch";
import { RetrievalEvent, RetrievalEventProps } from "../../../src/models/retrieval-event";
import { Phase } from "../../../src/models/phase";
import { EventName } from "../../../src/models/event-name";
import { ValidationError } from "../../../src/models/validation-error";
import { expect } from "chai";

describe("PostgresRetrievalEventRepo", () => {
  describe("saveBatch()", () => {
    it("writes a multi insert query", async () => {
      const repo = new PostgresRetrievalEventRepo();

      // Stub the repo's pool.query function
      const queryStub = stub(repo["pool"], "query").resolves();

      const event1: RetrievalEventProps = {
        retrievalId: "test retrieval ID #1",
        instanceId: "test instance ID #1",
        cid: "test cid #1",
        phase: Phase.VALUES[0],
        phaseStartTime: "1970-01-01T00:00:00.000Z",
        eventName: EventName.VALUES[0],
        eventTime: "1970-01-02T00:00:00.000Z"
      };
      const event2: RetrievalEventProps = {
        retrievalId: "test retrieval ID #2",
        instanceId: "test instance ID #2",
        cid: "test cid #2",
        phase: Phase.VALUES[1],
        phaseStartTime: "1970-01-03T00:00:00.000Z",
        eventName: EventName.VALUES[1],
        eventTime: "1970-01-04T00:00:00.000Z"
      };

      const batch = RetrievalEventBatch.create({
        events: [event1, event2]
      });

      if(batch instanceof ValidationError) expect.fail(batch.message);

      await repo.saveBatch(batch);

      expect(queryStub.args[0][0]).to.be.eql(`INSERT INTO retrieval_events(retrieval_id,instance_id,cid,storage_provider_id,phase,phase_start_time,event_name,event_time,event_details) VALUES ('test retrieval ID #1', 'test instance ID #1', 'test cid #1', NULL, '${Phase.VALUES[0]}', '1970-01-01T00:00:00.000Z', '${EventName.VALUES[0]}', '1970-01-02T00:00:00.000Z', NULL), ('test retrieval ID #2', 'test instance ID #2', 'test cid #2', NULL, '${Phase.VALUES[1]}', '1970-01-03T00:00:00.000Z', '${EventName.VALUES[1]}', '1970-01-04T00:00:00.000Z', NULL);`);
    });
  });
});