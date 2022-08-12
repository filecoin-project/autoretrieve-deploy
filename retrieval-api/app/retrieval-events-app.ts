#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { ApiStack } from "../src/infra/stacks/api-stack";
import { DatabaseStack } from "../src/infra/stacks/database-stack";
import { ServerStack } from "../src/infra/stacks/server-stack";

const ACCOUNT_ID = '407967248065';
const STACK_PROPS = {
  env: {
    account: ACCOUNT_ID,
    region: 'us-east-2'
  },
  tags: {
    app: "autoretrieve"
  }
};

const app = new App();
const databaseStack = new DatabaseStack(app, 'AutoretrieveRetrievalEventsStack', {
  stackName: 'AutoretrieveRetrievalEventsStack',
  description: 'Autoretrieve Retrieval Events | VPC and Database',
  ...STACK_PROPS
});

new ServerStack(app, "ServerStack", {
  stackName: "AutoretrieveRetreivalEventsServerStack",
  description: "Autoretrieve Retrieval Events | EC2 pgAdmin Server",
  database: databaseStack.database,
  databaseSecurityGroup: databaseStack.securityGroup,
  vpc: databaseStack.vpc,
  ...STACK_PROPS
});

new ApiStack(app, "ApiStack", {
  stackName: "AutoretrieveRetrievalEventsApiStack",
  description: "Autoretrieve Retrieval Events | API and Lambdas",
  database: databaseStack.database,
  databaseSecurityGroup: databaseStack.securityGroup,
  databaseUsername: databaseStack.databaseUsername,
  vpc: databaseStack.vpc,
  ...STACK_PROPS
});
