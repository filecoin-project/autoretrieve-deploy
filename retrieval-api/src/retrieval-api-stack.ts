// import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2";
// import { HttpLambdaAuthorizer, HttpLambdaResponseType } from "@aws-cdk/aws-apigatewayv2-authorizers";
// import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations";
// // import { Vpc } from "@aws-cdk/aws-ec2";
// import { Code, Function, Runtime } from "@aws-cdk/aws-lambda";
// import { CfnOutput, Construct, Duration, Stack, StackProps } from "@aws-cdk/core";

import { Construct } from "constructs";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { aws_apigateway as apig } from "aws-cdk-lib";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RequestAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";


export class RetrievalEventsStack extends Stack {
  constructor(scope: Construct, id: string, props: RetrievalEventsStackProps) {
    super(scope, id, props);

    const prefix = "AutoretrieveRetrievalEvents";

    // All resources should be in this VPC
    // const vpc = new Vpc(this, "RetrievalEventsVpc", {
    //   vpcName: `${prefix}-vpc`
    // });

    // Function for saving retrieval events
    const saveRetrievalEventFn = new Function(this, "SaveRetrievalEventFunction", {
      functionName: `${prefix}-SaveRetrievalEventLambda`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {

      },
      memorySize: 1024,
      timeout: Duration.seconds(5)
    });

    // API for retrieval events
    const api = new apig.RestApi(this, "RestApi", {
      restApiName: `${prefix}-RestApi`
    });

    // Setup the API resource for POSTing retrieval events
    const retrievalEventsResource = api.root.addResource("retrieval-events");
    const postRetrievalEventsIntegration = new LambdaIntegration(saveRetrievalEventFn);

    // Generate secret string for API Key
    const apiKeySecret = new Secret(this, "ApiKeySecret", {
      secretName: `${prefix}-ApiKeySecret`,
      description: "The API key for authorizing with the Autoretrieve Retrieval Events API.",
      generateSecretString: {
        excludePunctuation: true
      }
    });

    // Function for basic authorization
    const basicAuthFn = new Function(this, "BasicAuthLambdaAuthorizerFunction", {
      functionName: `${prefix}-BasicAuthLambdaAuthorizer`,
      code: Code.fromAsset("dist/lambdas/BasicAuthLambdaAuthorizer"),
      handler: "index.BasicAuthLambdaAuthorizer",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        API_ENDPOINT_ARN: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/POST/retrieval-events`,
        API_KEY_SECRET_ARN: apiKeySecret.secretFullArn!
      },
      memorySize: 1024,
      timeout: Duration.seconds(5)
    });

    // Allow the basic auth function to read the secret
    apiKeySecret.grantRead(basicAuthFn);

    // The basic auth authorizer
    const basicAuthAuthorizer = new RequestAuthorizer(this, "BasicAuthAuthorizer", {
      authorizerName: `${prefix}-BasicAuthAuthorizer`,
      handler: basicAuthFn,
      identitySources: [],
      resultsCacheTtl: Duration.minutes(0)
    });

    // The POST method for saving retrieval events
    retrievalEventsResource.addMethod("POST", postRetrievalEventsIntegration, {
      authorizer: basicAuthAuthorizer,
      operationName: "Save retrieval event"
    });
  }
}

interface RetrievalEventsStackProps extends StackProps {}