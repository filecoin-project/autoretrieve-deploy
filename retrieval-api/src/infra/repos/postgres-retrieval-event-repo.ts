import { RetrievalEvent } from "../../models/retrieval-event";
import { RetrievalEventRepo } from "../../repos/retrieval-event-repo";

import { Pool, PoolConfig } from "pg";

export class PostgresRetrievalEventRepo implements RetrievalEventRepo {  
  private pool: Pool;
  
  constructor(props?: PostgresRetrivalEventRepoProps) {
    const poolProps = props?.poolConfig ?? undefined;
    this.pool = new Pool(poolProps);
  }

  save(retrievalEvent: RetrievalEvent): Promise<void> {
    const queryStr = `
      INSERT INTO retrieval_events(retrievalId, cid)
      VALUES($1, $2, $3)
    `;
    const values = [retrievalEvent.retrievalId, retrievalEvent.cid];

    return this.pool.query(queryStr, values)
      .then(() => {
        console.debug("Saved retrieval event.");
      })
      .catch(err => {
        console.error("Could not save retrieval event.");
        throw err;
      });
  }
}

type PostgresRetrivalEventRepoProps = {
  poolConfig?: PoolConfig
}