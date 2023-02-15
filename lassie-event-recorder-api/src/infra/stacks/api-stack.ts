import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { LambdaIntegration, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { CustomDatabase } from "../constructs/custom-database";

export interface ApiStackProps extends StackProps {
  database: CustomDatabase
  databaseEnvironment: {[key: string]: string}
  prefix: string
  vpc: Vpc
}

export class ApiStack extends Stack {
  readonly api: RestApi;
  readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const prefix = Stack.of(this).stackName;

    // The security group for the lambdas
    this.securityGroup = new SecurityGroup(this, "ApiSecurityGroup", {
      securityGroupName: `${props.prefix}ApiSecurityGroup`,
      vpc: props.vpc
    });
    props.database.addIngressRule(this.securityGroup, Port.tcp(5432), "from API lambdas", true);

    // Function for saving retrieval events
    const saveRetrievalEventFn = new Function(this, "SaveRetrievalEventFunction", {
      functionName: `${prefix}-SaveRetrievalEventLambda`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        ...props.databaseEnvironment
      },
      memorySize: 1024,
      securityGroups: [this.securityGroup],
      timeout: Duration.seconds(5),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
    });

    // Grant the lambda connection abilities to the database
    props.database.grantConnectFromLambda(this, saveRetrievalEventFn)
    // Give the other apig stages the ability to invoke the lambda
    saveRetrievalEventFn.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));

    // Generate secret string for API Key
    const apiKeySecret = new Secret(this, "ApiKeySecret", {
      secretName: `${prefix}-ApiKeySecret`,
      description: "The API key for authorizing with the Event Recorder API.",
      generateSecretString: {
        excludePunctuation: true
      }
    });

    /**********************************************
      API
    ***********************************************/

    // API root
    const api = new RestApi(this, "RestApi", {
      restApiName: `${prefix}-RestApi`
    });

    // Function for basic authorization
    const basicAuthFn = new Function(this, "BasicAuthLambdaAuthorizerFunction", {
      functionName: `${prefix}-BasicAuthLambdaAuthorizer`,
      code: Code.fromAsset("dist/lambdas/BasicAuthLambdaAuthorizer"),
      handler: "index.BasicAuthLambdaAuthorizer",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        API_ENDPOINT_ARN: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/POST/v1/retrieval-events`,
        API_KEY_SECRET_ARN: apiKeySecret.secretFullArn!
      },
      memorySize: 1024,
      timeout: Duration.seconds(5),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      }
    });
    // Allow the basic auth function to read the secret
    apiKeySecret.grantRead(basicAuthFn);

    // The basic auth authorizer for the API routes
    const basicAuthAuthorizer = new RequestAuthorizer(this, "BasicAuthAuthorizer", {
      authorizerName: `${prefix}-BasicAuthAuthorizer`,
      handler: basicAuthFn,
      identitySources: [],
      resultsCacheTtl: Duration.minutes(0)
    });

    // Setup the API resource for POSTing retrieval events
    const v1 = api.root.addResource("v1");
    const v1RetrievalEvents = v1.addResource("retrieval-events");

    // The POST method for saving retrieval events
    v1RetrievalEvents.addMethod("POST", new LambdaIntegration(saveRetrievalEventFn), {
      authorizer: basicAuthAuthorizer
    });
  }
}
