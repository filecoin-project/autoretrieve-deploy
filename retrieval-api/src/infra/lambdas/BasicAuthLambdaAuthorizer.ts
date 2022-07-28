import { SecretsManager } from "@aws-sdk/client-secrets-manager";
import { BasicAuthLambdaAuthorizer } from "../controllers/basic-auth-lambda-authorizer";

const secretsManager = new SecretsManager({});
exports.BasicAuthLambdaAuthorizer = new BasicAuthLambdaAuthorizer({ secretsManager }).handler;