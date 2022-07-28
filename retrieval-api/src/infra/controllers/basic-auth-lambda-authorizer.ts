import { SecretsManager } from "@aws-sdk/client-secrets-manager";

const API_ENDPOINT_ARN = process.env.API_ENDPOINT_ARN;
if(!API_ENDPOINT_ARN) throw Error("API_ENDPOINT_ARN environment variable is undefined.");

const API_KEY_SECRET_ARN = process.env.API_KEY_SECRET_ARN;
if(!API_KEY_SECRET_ARN) throw Error("API_KEY_SECRET_ARN environment variable is undefined.");

export class BasicAuthLambdaAuthorizer {
  private secretsManager: SecretsManager;

  constructor(props: BasicAuthLambdaAuthorizerProps) {
    this.secretsManager = props.secretsManager;
  }

  public handler = async (event: any): Promise<any> => {
    // Decode the value in the Authorization header
    const encodedCreds = event.headers.Authorization.split(' ')[1]
    const providedApiKey = Buffer.from(encodedCreds, "base64").toString();

    // Get the stored API Key
    let storedApiKey;
    try {
      storedApiKey = await this.getApiKey();
    } catch {
      console.error(`Could not get secret value from secret: ${API_KEY_SECRET_ARN}.`);
      return this.generatePolicy(false);
    }

    // Return a policy that allows or denys the client from accessing retrieval-events API endpoint
    return this.generatePolicy(providedApiKey === storedApiKey);
  }

  /**
   * Generates a policy document describing access to the Retrieval Events API endpoint.
   * @param allow A boolean that Allows or Denies the client from access to the Retrieval Events API endpoint
   * @returns A policy document describing access to the Retrieval Events API endpoint
   */
  private generatePolicy = (allow: boolean) => {
    return {
      "principalId": "user",
      "policyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "execute-api:Invoke",
            "Effect": allow ? "Allow" : "Deny",
            "Resource": API_ENDPOINT_ARN
          }
        ]
      }
    };
  }

  /**
   * Gets the stored API Key from AWS SecretsManager. Throws if there is a problem
   * getting the secret from Secrets Manager.
   * @returns The stored API key, or undefined if the API key secret cannot be found
   */
  private async getApiKey(): Promise<string | undefined> {
    const secret = await this.secretsManager.getSecretValue({ SecretId: API_KEY_SECRET_ARN });
    return secret?.SecretString;
  }
}

type BasicAuthLambdaAuthorizerProps = {
  secretsManager: SecretsManager
}