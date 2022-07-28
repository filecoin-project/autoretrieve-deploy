import { SaveRetrievalEvent } from "../../use-cases/save-retrieval-event";
import { SaveRetrievalEventController } from "../controllers/save-retrieval-event-controller";
import { PostgresRetrievalEventRepo } from "../repos/postgres-retrieval-event-repo";

const retrievalEventRepo = new PostgresRetrievalEventRepo();
const useCase = new SaveRetrievalEvent({ retrievalEventRepo });

exports.SaveRetrievalEventLambda = new SaveRetrievalEventController(useCase).handler;