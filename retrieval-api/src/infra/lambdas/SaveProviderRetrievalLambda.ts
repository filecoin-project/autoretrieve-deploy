import { SaveProviderRetrieval } from "../../use-cases/save-provider-retrieval";
import { SaveProviderRetrievalController } from "../controllers/save-provider-retrieval-controller";
import { PostgresProviderRetrievalRepo } from "../repos/postgres-provider-retrieval-repo";

const providerRetrievalRepo = new PostgresProviderRetrievalRepo();
const useCase = new SaveProviderRetrieval({ providerRetrievalRepo });

exports.SaveProviderRetrieval = new SaveProviderRetrievalController(useCase).handler;