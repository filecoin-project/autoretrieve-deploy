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
      INSERT INTO retrieval_events(
        retrieval_id,
        instance_id,
        cid,
        storage_provider_id,
        phase,
        phase_start_time,
        event_name,
        event_time,
        event_details
      )
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9);
    `;
    const { retrievalId, instanceId, cid, storageProviderId, phase, phaseStartTime, eventName, eventTime, eventDetails } = retrievalEvent;
    const values = [retrievalId, instanceId, cid, storageProviderId, phase.value, phaseStartTime.value, eventName.value, eventTime.value, eventDetails];

    try {
      await this.pool.query(queryStr, values);
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