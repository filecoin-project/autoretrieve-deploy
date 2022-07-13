import { ProviderRetrieval } from "../../models/provider-retrieval";
import { ProviderRetrievalRepo } from "../../repos/provider-retrieval-repo";

import { Pool, PoolConfig } from "pg";

export class PostgresProviderRetrievalRepo implements ProviderRetrievalRepo {  
  private pool: Pool;
  
  constructor(props?: PostgresProviderRetrivalRepoProps) {
    const poolProps = props?.poolConfig ?? undefined;
    this.pool = new Pool(poolProps);
  }

  save(providerRetrieval: ProviderRetrieval): Promise<void> {
    const queryStr =
      `
      INSERT INTO provider_retrievals(
        autoretrievaInstanceId,
        cid,
        peerId
      )
      VALUES($1, $2, $3)
      `;
    const queryVals = [
      providerRetrieval.autoretrieveInstanceId,
      providerRetrieval.cid,
      providerRetrieval.peerId
    ];

    return this.pool.query(queryStr, queryVals)
      .then(() => {
        console.debug("Saved provider retrieval.");
      })
      .catch(err => {
        console.error("Could not save provider retrieval.");
        throw err;
      });
  }
}

type PostgresProviderRetrivalRepoProps = {
  poolConfig?: PoolConfig
}