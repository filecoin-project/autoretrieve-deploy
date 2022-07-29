import { RetrievalEvent } from "../../models/retrieval-event";
import { RetrievalEventRepo } from "../../repos/retrieval-event-repo";
import { Pool, PoolConfig } from "pg";

export class PostgresRetrievalEventRepo implements RetrievalEventRepo {
  private pool: Pool;
  
  constructor(props?: PostgresRetrivalEventRepoProps) {
    const poolProps = props?.poolConfig ?? undefined;
    this.pool = new Pool(poolProps);

    this.pool.on("connect", () => {
      console.log("Connected to db");
    });
  }

  async save(retrievalEvent: RetrievalEvent): Promise<void> {
    const queryStr = `
      INSERT INTO retrieval_events(retrieval_id)
      VALUES($1)
    `;
    const values = [retrievalEvent.retrievalId];

    try {
      await this.pool.query(queryStr, values)
      console.debug("Saved retrieval event.");
    } catch(err) {
      console.error("Could not execute insert query for retrieval event.");
      throw err;
    }
  }
}

type PostgresRetrivalEventRepoProps = {
  poolConfig?: PoolConfig
}