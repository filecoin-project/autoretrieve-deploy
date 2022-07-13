import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { BasicAuthLambdaAuthorizer } from "../controllers/basic-auth-lambda-authorizer";

const API_ENDPOINT_ARN = process.env.API_ENDPOINT_ARN;
if(!API_ENDPOINT_ARN) throw Error("API_ENDPOINT_ARN environment variable is undefined.");

const API_KEY_SECRET_ARN = process.env.API_KEY_SECRET_ARN;
if(!API_KEY_SECRET_ARN) throw Error("API_KEY_SECRET_ARN environment variable is undefined.");

const secretsManager = new SecretsManager({});

const authorizerProps = {
  apiEndpointArn: API_ENDPOINT_ARN,
  apiKeySecretArn: API_KEY_SECRET_ARN,
  secretsManager
};
exports.BasicAuthLambdaAuthorizer = new BasicAuthLambdaAuthorizer(authorizerProps).handler;