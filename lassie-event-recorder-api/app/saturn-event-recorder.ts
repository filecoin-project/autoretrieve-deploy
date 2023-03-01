#!/usr/bin/env node
import "source-map-support/register";
import { App, Duration } from "aws-cdk-lib";
import { ApiStack } from "../src/infra/stacks/api-stack";
import { DatabaseStack } from "../src/infra/stacks/database-stack";
import { DeleteOldEventsStack } from "../src/infra/stacks/delete-old-events-stack";
import { ServerStack } from "../src/infra/stacks/server-stack";
import { VpcStack } from "../src/infra/stacks/vpc-stack";
const ACCOUNT_ID = "407967248065";
const STACK_PROPS = {
  env: {
    account: ACCOUNT_ID,
    region: "us-east-2"
  },
  tags: {
    app: "lassie",
    client: "saturn"
  }
};
const PREFIX = "SaturnLassieEvents";
const DESCRIPTION_PREFIX = "Saturn Lassie Events"

const app = new App();

const { vpc } = new VpcStack(app, "VpcStack", {
  description: `${DESCRIPTION_PREFIX} | VPC`,
  stackName: `${PREFIX}VpcStack`,
  prefix: PREFIX,
  ...STACK_PROPS
});

const { database, proxy } = new DatabaseStack(app, "DatabaseStack", {
  description: `${DESCRIPTION_PREFIX} | Database`,
  stackName: `${PREFIX}DatabaseStack`,
  prefix: PREFIX,
  vpc,
  proxyBorrowTimeout: Duration.seconds(30),
  ...STACK_PROPS
});

const databaseEnvironment = {
  DB_HOST: proxy.endpoint,
  DB_PORT: database.secret.secretValueFromJson("port").toString(),
  // Passing the password via environment variable is not ideal, but it allows us to use connection pools effeciently
  DB_PASSWORD: database.secret.secretValueFromJson("password").toString(),
  DB_USERNAME: database.username,
  DB_NAME: database.secret.secretValueFromJson("dbname").toString()
};

new DeleteOldEventsStack(app, "DeleteOldEventsStack", {
  description: `${DESCRIPTION_PREFIX} | Lambda for deleting old events from the database`,
  stackName: `${PREFIX}DeleteOldEventsStack`,
  database,
  proxy,
  databaseEnvironment,
  prefix: PREFIX,
  interval: "1 week",
  vpc,
  ...STACK_PROPS
});

new ServerStack(app, "ServerStack", {
  description: `${DESCRIPTION_PREFIX} | EC2 Server`,
  stackName: `${PREFIX}ServerStack`,
  database,
  ec2KeyPairName: "saturn-lassie-events-server-key-pair",
  ec2InstanceName: "saturn-lassie-events-server",
  prefix: PREFIX,
  vpc,
  ...STACK_PROPS
});

new ApiStack(app, "ApiStack", {
  description: `${DESCRIPTION_PREFIX} | API`,
  stackName: `${PREFIX}ApiStack`,
  database,
  proxy,
  databaseEnvironment,
  prefix: PREFIX,
  vpc,
  ...STACK_PROPS
});
