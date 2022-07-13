import { SaveRetrievalEvent } from "../../use-cases/save-retrieval-event";
import { SaveRetrievalEventController } from "../controllers/save-retrieval-event-controller";
import { PostgresRetrievalEventRepo } from "../../infra/repos/postgres-retrieval-event-repo";

const DB_HOST = process.env.DB_HOST;
if(DB_HOST === undefined) throw Error("DB_HOST environment variable is undefined.");

const DB_PORT = process.env.DB_PORT;
if(DB_PORT === undefined) throw Error("DB_PORT environment variable is undefined.");

const DB_PASSWORD = process.env.DB_PASSWORD;
if(DB_PASSWORD === undefined) throw Error("DB_PASSWORD environment variable is undefined.");

const DB_USERNAME = process.env.DB_USERNAME;
if(DB_USERNAME === undefined) throw Error("DB_USERNAME environment variable is undefined.");

const DB_NAME = process.env.DB_NAME;
if(DB_NAME === undefined) throw Error("DB_NAME environment variable is undefined.");

let poolConfig = {
  host: DB_HOST,
  port: Number(DB_PORT),
  password: DB_PASSWORD,
  user: DB_USERNAME,
  database: DB_NAME
};

const retrievalEventRepo = new PostgresRetrievalEventRepo({ poolConfig });
const useCase = new SaveRetrievalEvent({ retrievalEventRepo });


exports.SaveRetrievalEventLambda = new SaveRetrievalEventController(useCase).handler;