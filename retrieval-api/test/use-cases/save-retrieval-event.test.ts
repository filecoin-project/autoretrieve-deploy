import { expect } from "chai";
import sinon, { SinonStubbedInstance } from "sinon";
import { PostgresRetrievalEventRepo } from "../../src/infra/repos/postgres-retrieval-event-repo";
import { EventName } from "../../src/models/event-name";
import { Phase } from "../../src/models/phase";
import { RetrievalEvent } from "../../src/models/retrieval-event";
import { RetrievalEventBatch } from "../../src/models/retrieval-event-batch";
import { ValidationError } from "../../src/models/validation-error";
import { RetrievalEventRepo } from "../../src/repos/retrieval-event-repo";
import { SaveRetrievalEvent } from "../../src/use-cases/save-retrieval-event";

describe("SaveRetrievalEvent", () => {
  it("saves a retrieval event batch", async () => {
    let retrievalEventRepo: SinonStubbedInstance<RetrievalEventRepo>;
    retrievalEventRepo = sinon.createStubInstance(PostgresRetrievalEventRepo);
    retrievalEventRepo.save.resolves();

    const retrievalEventBatch = RetrievalEventBatch.create({
      events: [
        {
          retrievalId: "test retrieval ID",
          instanceId: "test instance ID",
          cid: "test cid",
          phase: Phase.VALUES[0],
          phaseStartTime: "1970-01-01T00:00:00.000Z",
          eventName: EventName.VALUES[0],
          eventTime: "1970-01-02T00:00:00.000Z"
        }
      ]
    });
    if(retrievalEventBatch instanceof ValidationError) expect.fail(retrievalEventBatch.message);

    const useCase = new SaveRetrievalEvent({ retrievalEventRepo });
    await useCase.execute({ retrievalEventBatch });

    sinon.assert.calledOnce(retrievalEventRepo.saveBatch);
    sinon.assert.calledWith(retrievalEventRepo.saveBatch, retrievalEventBatch);
  });
});