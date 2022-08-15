import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { IRestApi, LambdaIntegration, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Grant, IPrincipal, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { DatabaseInstance } from "aws-cdk-lib/aws-rds";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";
import { Construct } from "constructs";

export interface ApiStackProps extends StackProps {
  database: DatabaseInstance
  databaseSecurityGroup: SecurityGroup
  databaseUsername: string
  vpc: Vpc
}

export class ApiStack extends Stack {
  readonly api: RestApi;
  readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const prefix = Stack.of(this).stackName;

    // The security group for the lambdas
    this.securityGroup = new SecurityGroup(this, "LambdaDatabaseProxy", {
      vpc: props.vpc
    });
    props.databaseSecurityGroup.addIngressRule(this.securityGroup, Port.tcp(5432), "Allow access from lambdas", true);

    // Function for saving retrieval events
    const saveRetrievalEventFn = new Function(this, "SaveRetrievalEventFunction", {
      functionName: `${prefix}-SaveRetrievalEventLambda`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        DB_HOST: props.database.secret?.secretValueFromJson("host").toString()!,
        DB_PORT: props.database.secret?.secretValueFromJson("port").toString()!,
        // Passing the password via environment variable is not ideal, but it allows us to use connection pools effeciently
        DB_PASSWORD: props.database.secret?.secretValueFromJson("password").toString()!,
        DB_USERNAME: props.databaseUsername,
        DB_NAME: props.database.secret?.secretValueFromJson("dbname").toString()!
      },
      memorySize: 1024,
      timeout: Duration.seconds(5),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      securityGroups: [this.securityGroup]
    });
    // Give the function network access to the database
    // props.database.connections.allowFrom(saveRetrievalEventFn, Port.tcp(5432));
    // Give the function permission to access the database and database credentials
    grantConnect(this, props.database, props.databaseUsername, saveRetrievalEventFn.role?.grantPrincipal!);
    props.database.secret?.grantRead(saveRetrievalEventFn);
    // Give the other apig stages the ability to invoke the lambda
    saveRetrievalEventFn.grantInvoke(new ServicePrincipal("apigateway.amazonaws.com"));

    // Generate secret string for API Key
    const apiKeySecret = new Secret(this, "ApiKeySecret", {
      secretName: `${prefix}-ApiKeySecret`,
      description: "The API key for authorizing with the Autoretrieve Retrieval Events API.",
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
        API_ENDPOINT_ARN: `arn:aws:execute-api:${this.region}:${this.account}:${api.restApiId}/*/POST/retrieval-events`,
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

// Custom grantConnect function due to a bug in AWS where an RDS instance's resource ID is not available from Cloudformation.
// More information here: https://github.com/aws/aws-cdk/issues/11851
function grantConnect(scope: Stack, db: DatabaseInstance, dbUsername: string, grantPrincipal: IPrincipal) {
  // This could be undefined in some cases, just no op.
  if(grantPrincipal === undefined){
    console.warn(`Could not grant connect to RDS instance ${db.instanceIdentifier} because grant principle is undefined.`); 
    return;
  }

  // Custom resource for retrieving the DB Resource ID from an RDS instance using an SDK call
  const dbResourceId = new AwsCustomResource(
    scope,
    `RdsResourceId-${grantPrincipal}`,
    {
      onUpdate: {
        service: "RDS",
        action: "describeDBInstances",
        parameters: {
          DBInstanceIdentifier: db.instanceIdentifier,
        },
        physicalResourceId: PhysicalResourceId.fromResponse(
          "DBInstances.0.DbiResourceId"
        ),
        outputPaths: ["DBInstances.0.DbiResourceId"],
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    }
  );
  const resourceId = dbResourceId.getResponseField(
    "DBInstances.0.DbiResourceId"
  );

  // Ensure this custom resource waits for the DB instance lifecycle to complete before executing it's own lifecycle
  dbResourceId.node.addDependency(db);

  // This is the correct ARN structure needed
  const dbUserArn = `arn:aws:rds-db:${scope.region}:${scope.account}:dbuser:${resourceId}/${dbUsername}`;

  // Add the rds-db:connect action and correct DB instance ARN to the grant principle
  Grant.addToPrincipal({
    grantee: grantPrincipal,
    actions: ['rds-db:connect'],
    resourceArns: [dbUserArn],
  });
}