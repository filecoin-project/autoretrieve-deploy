import { Construct } from "constructs";
import { CfnOutput, Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { aws_apigateway as apig } from "aws-cdk-lib";
import { AmazonLinuxGeneration, AmazonLinuxImage, Instance, InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { LambdaIntegration, RequestAuthorizer } from "aws-cdk-lib/aws-apigateway";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, PostgresEngineVersion } from "aws-cdk-lib/aws-rds";


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
          name: `${prefix}-PublicSubnet1`,
          subnetType: SubnetType.PUBLIC
        },
        {
          name: `${prefix}-IsolatedSubnet1`,
          subnetType: SubnetType.PRIVATE_ISOLATED
        }
      ],
      vpcName: `${prefix}-Vpc`
    });

    // We create an EC2 instance to access the DB in the private VPC
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

    // Create the database
    const database = new DatabaseInstance(this, "Database", {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PUBLIC
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
    // TODO: Allow access from the created EC2 instance
    database.connections.allowFrom(ec2, Port.tcp(5432));

    // Output the Database endpoint and secret name
    new CfnOutput(this, "DatabaseEndpoint", {
      value: database.instanceEndpoint.hostname,
    });
    new CfnOutput(this, "DatabaseSecretName", {
      value: database.secret?.secretName!
    });

    // Function for saving retrieval events
    const saveRetrievalEventFn = new Function(this, "SaveRetrievalEventFunction", {
      functionName: `${prefix}-SaveRetrievalEventLambda`,
      code: Code.fromAsset("dist/lambdas/SaveRetrievalEventLambda"),
      handler: "index.SaveRetrievalEventLambda",
      runtime: Runtime.NODEJS_16_X,
      environment: {
        DB_HOST: database.secret?.secretValueFromJson("host").toString()!,
        DB_PORT: database.secret?.secretValueFromJson("port").toString()!,
        // This isn't ideal, but it allows us to use connection pools
        DB_PASSWORD: database.secret?.secretValueFromJson("password").toString()!,
        DB_USERNAME: database.secret?.secretValueFromJson("username").toString()!,
        DB_NAME: database.secret?.secretValueFromJson("dbname").toString()!
      },
      memorySize: 1024,
      timeout: Duration.seconds(5)
    });

    // Give the function access to the database
    database.grantConnect(saveRetrievalEventFn);
    database.secret?.grantRead(saveRetrievalEventFn);

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
      authorizer: basicAuthAuthorizer
    });
  }
}

interface RetrievalEventsStackProps extends StackProps {}