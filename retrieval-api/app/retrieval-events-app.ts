#!/usr/bin/env node
import 'source-map-support/register';
import { App } from 'aws-cdk-lib';
import { RetrievalEventsStack } from "../src/retrieval-api-stack";

const ACCOUNT_ID = '407967248065';

const app = new App();
new RetrievalEventsStack(app, 'AutoretrieveRetrievalEventsStack', {
  stackName: 'AutoretrieveRetrievalEventsStack',
  description: 'Autoretrieve Retrieval Events',
  env: {
    account: ACCOUNT_ID,
    region: 'us-east-2'
  },
  tags: {
    app: "autoretrieve"
  }
});