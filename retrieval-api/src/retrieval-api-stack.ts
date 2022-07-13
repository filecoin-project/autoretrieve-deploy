import { Construct } from "constructs";
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import {
  AmazonLinuxGeneration, AmazonLinuxImage, CfnKeyPair,
  Instance, InstanceClass, InstanceSize,
  InstanceType, InterfaceVpcEndpointAwsService, Peer,
  Port, SecurityGroup, SubnetType,
  Vpc
} from "aws-cdk-lib/aws-ec2";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RequestAuthorizer, RestApi } from "aws-cdk-lib/aws-apigateway";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";
import { Grant, IPrincipal } from "aws-cdk-lib/aws-iam";
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from "aws-cdk-lib/custom-resources";

export class RetrievalEventsStack extends Stack {
  constructor(scope: Construct, id: string, props: RetrievalEventsStackProps) {
    super(scope, id, props);

    const prefix = "AutoretrieveRetrievalEvents";

    // All resources should be in this VPC
    const vpc = new Vpc(this, "Vpc", {
      natGateways: 0,
      maxAzs: 3,
      subnetConfiguration: [
        {
          name: `${prefix}-PublicSubnet`,
          subnetType: SubnetType.PUBLIC
        },
        {
          name: `${prefix}-PostgresSubnet`,
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpcName: `${prefix}-Vpc`
    });
    // So that our lambdas can access secrets manager from within the private subnet
    vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
    })

    // Create the database
    const database = new DatabaseInstance(this, "Database", {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      },
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_14_2
      }),
      credentials: Credentials.fromGeneratedSecret("postgres"),
      backupRetention: Duration.days(0),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.DESTROY, // TODO: Update this to RETAIN when done testing
      databaseName: `${prefix}Db`,
      publiclyAccessible: false
    });
    // Output the Database endpoint and secret name
    new CfnOutput(this, "DatabaseEndpoint", {
      value: database.instanceEndpoint.hostname,
    });
    new CfnOutput(this, "DatabaseSecretName", {
      value: database.secret?.secretName!
    });
    // We use the DB username in a few places
    const dbUsername = database.secret?.secretValueFromJson("username").toString()!;

    // Security group for EC2
    const ec2SecurityGroup = new SecurityGroup(this, "Ec2SecurityGroup", { vpc });
    // Allow SSH connects to the EC2 instance from anywhere
    ec2SecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22));
    // Create the EC2 instance
    const ec2 = new Instance(this, "Ec2Instance", {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
      },
      securityGroup: ec2SecurityGroup,
      instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.MICRO),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      keyName: "autoretrieve-retrieval-events-key-pair"
    });
    // Give the EC2 instance network access to the database
    database.connections.allowFrom(ec2, Port.tcp(5432));

    new CfnKeyPair(this, "Ec2KeyPair", { keyName: "autoretrieve-retrieval-events-key-pair" });

    // Function for saving retrieval events
    const saveRetrievalEventFn = new Function(this, "SaveRetrievalEventFunction", {
      functionName: `${prefix}-SaveRetrievalEventLambda`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        DB_HOST: database.secret?.secretValueFromJson("host").toString()!,
        DB_PORT: database.secret?.secretValueFromJson("port").toString()!,
        // Passing the password via environment variable is not ideal, but it allows us to use connection pools effeciently
        DB_PASSWORD: database.secret?.secretValueFromJson("password").toString()!,
        DB_USERNAME: dbUsername,
        DB_NAME: database.secret?.secretValueFromJson("dbname").toString()!
      },
      memorySize: 1024,
      timeout: Duration.seconds(5),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      }
    });
    // Give the function network access to the database
    database.connections.allowFrom(saveRetrievalEventFn, Port.tcp(5432));
    // Give the function permission to access the database and database credentials
    grantConnect(this, database, dbUsername, saveRetrievalEventFn.role?.grantPrincipal!);
    database.secret?.grantRead(saveRetrievalEventFn);

    // API for retrieval events
    const api = new RestApi(this, "RestApi", {
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
      timeout: Duration.seconds(5),
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED
      }
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

interface RetrievalEventsStackProps extends StackProps {}