import { buildDbSchema } from "../db/buildDbSchema";
import { executeLogs } from "../indexer";
import { buildHandlers } from "../subgraph-compat/buildHandlers";
import { buildLogWorker } from "../subgraph-compat/buildLogWorker";
import { createOrUpdateDbTables } from "../subgraph-compat/createOrUpdateDbTables";
import { getRpcUrlMap } from "../subgraph-compat/getRpcUrlMap";
import { readSubgraphSchema } from "../subgraph-compat/readSubgraphSchema";
import { readSubgraphYaml } from "../subgraph-compat/readSubgraphYaml";

const start = async () => {
  const rpcUrlMap = getRpcUrlMap();

  const { graphCompatPonderConfig, graphSchemaFilePath } =
    await readSubgraphYaml(rpcUrlMap);

  const userSchema = await readSubgraphSchema(graphSchemaFilePath);

  const handlers = await buildHandlers(graphCompatPonderConfig);

  console.log({ handlers });

  const dbSchema = buildDbSchema(userSchema);

  await createOrUpdateDbTables(dbSchema);

  const logWorker = buildLogWorker(graphCompatPonderConfig, dbSchema, handlers);

  await executeLogs(graphCompatPonderConfig, logWorker);

  return;
};

export { start };
