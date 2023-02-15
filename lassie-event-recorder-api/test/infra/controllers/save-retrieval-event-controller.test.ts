import { RetrievalEvent } from "../../../src/models/retrieval-event";
import { SaveRetrievalEvent } from "../../../src/use-cases/save-retrieval-event";
import { SaveRetrievalEventController, SaveRetrievalEventControllerEvent } from "../../../src/infra/controllers/save-retrieval-event-controller";
import { ValidationError } from "../../../src/models/validation-error";
import { expect } from "chai";
import sinon from "sinon";
import { RetrievalEventBatch } from "../../../src/models/retrieval-event-batch";

describe("SaveRetrievalEventController", () => {
  describe("handler", () => {
    afterEach(() => {
      // Restore the default sandbox
      sinon.restore();
    });

    it("returns a 201 when the body of the request is valid", async () => {
      // Stub the model to create a stubbed RetrievalEvent
      // We don't care that this instance is actually invalid, we just
      // need it to succeed.
      const createStub = sinon.stub(RetrievalEventBatch, "create");
      // @ts-ignore | The constructor for RetrievalEvent is private
      createStub.returns(new RetrievalEvent());

      // Stub the use case to succeed
      const useCase = sinon.createStubInstance(SaveRetrievalEvent);
      useCase.execute.resolves();

      // Get the handler function from the controller
      const handlerFn = new SaveRetrievalEventController(useCase).handler;

      // We can pass a stubbed event since we're forcing a RetrievalEvent
      // from the model stub above
      const resp = await handlerFn({} as SaveRetrievalEventControllerEvent);
      
      expect(resp.statusCode).to.eql(201);
    });

    it("returns a 400 when the body of the request is invalid", async () => {
      // Stub the model to create a ValidationError
      const createStub = sinon.stub(RetrievalEventBatch, "create");
      const errorMessage = "returning a ValidationError for the test";
      createStub.returns(new ValidationError(errorMessage));

      // Stub the use case
      const useCase = sinon.createStubInstance(SaveRetrievalEvent);

      // Get the handler function from the controller
      const handlerFn = new SaveRetrievalEventController(useCase).handler;

      // We can pass a stubbed event since we're forcing a ValidationError
      // from the model stub above
      const resp = await handlerFn({} as SaveRetrievalEventControllerEvent);
      
      expect(resp.statusCode).to.eql(400);
      expect(JSON.parse(resp.body).errorMessage).to.eql(errorMessage);
    });
  });
});