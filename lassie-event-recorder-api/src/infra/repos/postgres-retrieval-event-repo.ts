import { RetrievalEvent } from "../../models/retrieval-event";
import { RetrievalEventRepo } from "../../repos/retrieval-event-repo";
import { Pool, PoolConfig } from "pg";
import { RetrievalEventBatch } from "../../models/retrieval-event-batch";
import PGFormat from "pg-format"

type PostgresRetrievalEventRepoProps = {
  poolConfig?: PoolConfig
}


export class PostgresRetrievalEventRepo implements RetrievalEventRepo {
  private pool: Pool;
  
  constructor(props: PostgresRetrievalEventRepoProps) {
    const poolProps = props.poolConfig ?? undefined;
    this.pool = new Pool(poolProps);

    this.pool.on("connect", () => {
      console.log("Connected to db");
    });
  }

  async createTable(): Promise<void> {
    const queryStr = `
      CREATE TABLE IF NOT EXISTS public.retrieval_events(
        retrieval_id uuid NOT NULL,
        instance_id character varying(64) NOT NULL,
        cid character varying(256) NOT NULL,
        storage_provider_id character varying(256) ,
        phase character varying(15) COLLATE NOT NULL,
        phase_start_time timestamp with time zone NOT NULL,
        event_name character varying(32) NOT NULL,
        event_time timestamp with time zone NOT NULL,
        event_details jsonb
      )
    `;

    try {
      await this.pool.query(queryStr);
      console.debug("Saved retrieval event.");
    } catch(err) {
      console.error("Could not execute create table query.");
      throw err;
    }
  }

  /**
   * Deletes old events from the database that are at least interval old
   * @param interval See https://www.postgresql.org/docs/14/datatype-datetime.html#DATATYPE-INTERVAL-INPUT.
   */
  async deleteOldEvents(interval: string): Promise<void> {
    const queryStr = `DELETE FROM retrieval_events WHERE event_time <= (CURRENT_TIMESTAMP::date - '${interval}'::interval);`;

    try {
      await this.pool.query(queryStr);
      console.debug("Deleted old retrieval events.");
    } catch(err) {
      console.error("Could not execute delete old events query for retrieval events.");
      throw err;
    }
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

  async saveBatch(retrievalEventBatch: RetrievalEventBatch): Promise<void> {
    if (retrievalEventBatch.events.length === 0) {
      console.debug(`Retrieval event batch is empty`);
      return;
    }

    const queryTmpl = `
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
      VALUES %L;
    `;

    const values = retrievalEventBatch.events.map(e => [e.retrievalId, e.instanceId, e.cid, e.storageProviderId, e.phase.value, e.phaseStartTime.value, e.eventName.value, e.eventTime.value, e.eventDetails]);
    const queryStr = PGFormat(queryTmpl, values)

    try {
      await this.pool.query(queryStr);
      console.debug(`Saved ${values.length} retrieval events.`);
    } catch(err) {
      console.error(`Could not execute insert query for ${values.length} retrieval events.`, { events: values });
      throw err;
    }
  }
}
